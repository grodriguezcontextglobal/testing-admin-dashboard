import { describe, expect, it } from "vitest";
import {
  DISPUTE,
  buildCloseoutReport,
  localCountView,
} from "./eventCloseoutReport";

/** What readCountResponse hands over, trimmed to what the report reads. */
const count = {
  ok: true,
  summary: { expected: 4, matched: 2, missing: 2 },
  matched: [
    { item_id: 1, serial_number: "SN-001", item_group: "RX-100", matchedVia: "epc" },
    { item_id: 2, serial_number: "SN-002", item_group: "RX-100", matchedVia: "serial" },
  ],
  missingTagged: [{ item_id: 3, serial_number: "SN-003", epc: "AAAA" }],
  missingUntagged: [{ item_id: 4, serial_number: "SN-004", epc: null }],
  ambiguousByItem: {},
};

/** What /receiver/receiver-assigned-list returns for devices still out. */
const receivers = [
  {
    device: { serialNumber: "SN-003", deviceType: "RX-100", deviceValue: 250 },
    paymentIntent: "pi_aaa",
  },
  {
    device: { serialNumber: "SN-004", deviceType: "RX-100", deviceValue: 250 },
    paymentIntent: "pi_bbb",
  },
];

const consumersByIntent = {
  pi_aaa: { name: "Ana", lastName: "Pérez", email: "ana@x.com" },
  pi_bbb: { name: "Beto", lastName: "Ruiz", email: "beto@x.com" },
};

const report = () =>
  buildCloseoutReport({ count, receivers, consumersByIntent });

describe("buildCloseoutReport — what goes back", () => {
  it("lists what the sweep found, which is what the warehouse receives", () => {
    expect(report().returning.map((row) => row.serial)).toEqual([
      "SN-001",
      "SN-002",
    ]);
  });

  it("keeps how each one was counted", () => {
    // Evidence of what the reader saved: counted by wave, or by hand.
    expect(report().returning.map((row) => row.matchedVia)).toEqual([
      "epc",
      "serial",
    ]);
  });
});

describe("buildCloseoutReport — what is still out, and with whom", () => {
  it("names the holder and the amount for each device that did not come back", () => {
    const [first] = report().outstanding;
    expect(first.serial).toBe("SN-003");
    expect(first.holder).toBe("Ana Pérez");
    expect(first.email).toBe("ana@x.com");
    expect(first.value).toBe(250);
    expect(first.paymentIntent).toBe("pi_aaa");
    expect(first.chargeable).toBe(true);
  });

  it("says whether the device was even tagged, because it changes the story", () => {
    // Tagged and silent is a device that did not answer. Untagged is a device
    // nothing could have detected — it may well be in the box.
    const rows = report().outstanding;
    expect(rows.find((row) => row.serial === "SN-003").tagged).toBe(true);
    expect(rows.find((row) => row.serial === "SN-004").tagged).toBe(false);
  });

  it("totals what could be charged", () => {
    expect(report().totals).toMatchObject({
      expected: 4,
      returning: 2,
      outstanding: 2,
      outstandingValue: 500,
      chargeable: 2,
    });
  });

  it("still lists a device whose holder cannot be named", () => {
    // Without the transaction lookup there is no name, but the payment intent
    // is enough to reach the person. Dropping the row would hide a device.
    const { outstanding } = buildCloseoutReport({ count, receivers });
    expect(outstanding).toHaveLength(2);
    expect(outstanding[0].holder).toBeNull();
    expect(outstanding[0].paymentIntent).toBe("pi_aaa");
    expect(outstanding[0].chargeable).toBe(true);
  });
});

describe("buildCloseoutReport — where the two sources disagree", () => {
  it("flags a device that did not come back and that nobody holds", () => {
    // The warehouse says it is still with the event; the consumer records say
    // it was handed back. Nobody to charge, and a device unaccounted for.
    const { outstanding, disputed } = buildCloseoutReport({
      count,
      receivers: [receivers[0]],
      consumersByIntent,
    });
    const orphan = disputed.find((row) => row.serial === "SN-004");
    expect(orphan.reason).toBe(DISPUTE.NO_HOLDER);
    expect(outstanding.find((row) => row.serial === "SN-004").chargeable).toBe(
      false
    );
  });

  it("flags a device that came back but is still assigned to someone", () => {
    // The dangerous one: it is physically on the shelf and the consumer's
    // record still has it. Charge from that record and you bill somebody for a
    // device you are holding.
    const { disputed } = buildCloseoutReport({
      count,
      receivers: [
        ...receivers,
        {
          device: { serialNumber: "SN-001", deviceType: "RX-100", deviceValue: 250 },
          paymentIntent: "pi_ccc",
        },
      ],
      consumersByIntent,
    });
    const returned = disputed.find((row) => row.serial === "SN-001");
    expect(returned.reason).toBe(DISPUTE.RETURNED_BUT_ASSIGNED);
    expect(returned.paymentIntent).toBe("pi_ccc");
  });

  it("is empty when the two sources agree", () => {
    expect(report().disputed).toEqual([]);
  });
});

describe("buildCloseoutReport — the gate on closing", () => {
  it("is not counted until a reconciliation has answered", () => {
    expect(buildCloseoutReport({ count: null, receivers }).counted).toBe(false);
    expect(buildCloseoutReport({ count: { ok: false } }).counted).toBe(false);
    expect(buildCloseoutReport({}).counted).toBe(false);
  });

  it("is counted once one has", () => {
    expect(report().counted).toBe(true);
  });

  it("does not require a complete count to allow closing", () => {
    // Deliberate, and it is the contract's position too: blocking the close on
    // missing devices makes the operator choose between lying and not closing.
    // The point of the gate is that a count HAPPENED, not that it was clean.
    const view = report();
    expect(view.counted).toBe(true);
    expect(view.totals.outstanding).toBe(2);
  });

  it("survives an empty event and a malformed payload", () => {
    const empty = buildCloseoutReport({
      count: { ok: true, summary: {}, matched: [], missingTagged: [], missingUntagged: [] },
    });
    expect(empty.returning).toEqual([]);
    expect(empty.outstanding).toEqual([]);
    expect(empty.totals.outstandingValue).toBe(0);
    expect(buildCloseoutReport().returning).toEqual([]);
    expect(buildCloseoutReport("nope").counted).toBe(false);
  });
});

describe("buildCloseoutReport — matching serials", () => {
  it("matches a serial whatever case each source stored it in", () => {
    const { outstanding } = buildCloseoutReport({
      count,
      receivers: [
        {
          device: { serialNumber: " sn-003 ", deviceType: "RX", deviceValue: 100 },
          paymentIntent: "pi_aaa",
        },
      ],
      consumersByIntent,
    });
    const row = outstanding.find((item) => item.serial === "SN-003");
    expect(row.value).toBe(100);
    expect(row.chargeable).toBe(true);
  });
});

/* ─────────── the gun path: the same report without the server involved ── */

describe("localCountView", () => {
  const pool = [
    { id: "r1", device: "SN-001", type: "RX-100", activity: true },
    { id: "r2", device: "SN-002", type: "RX-100", activity: true },
    { id: "r3", device: "SN-003", type: "RX-100", activity: true },
  ];

  it("shapes a browser-side comparison like the server's answer", () => {
    // So one report and one screen serve both paths: the gun today, the RFID
    // reader once event-count/* is deployed.
    const view = localCountView(pool, ["SN-001", "SN-002"]);
    expect(view.ok).toBe(true);
    expect(view.summary).toMatchObject({ expected: 3, scanned: 2, matched: 2, missing: 1 });
    expect(view.matched.map((row) => row.serial_number)).toEqual([
      "SN-001",
      "SN-002",
    ]);
  });

  it("says a serial was counted by hand, not by tag", () => {
    expect(
      localCountView(pool, ["SN-001"]).matched[0].matchedVia
    ).toBe("serial");
  });

  it("reports a scan that belongs to no device in this event", () => {
    const view = localCountView(pool, ["SN-001", "ZZZZ"]);
    expect(view.unknown).toEqual(["ZZZZ"]);
    expect(view.summary.unknown).toBe(1);
  });

  it("does not claim to know whether a missing device was tagged", () => {
    // A barcode sweep learns nothing about tags. Filing these under
    // "never tagged" would tell the operator not to worry about a device that
    // may well have a tag and have failed to answer.
    const view = localCountView(pool, []);
    expect(view.tagKnown).toBe(false);
    expect(view.missingUntagged).toHaveLength(3);
  });

  it("survives an empty pool and junk", () => {
    expect(localCountView([], []).summary.expected).toBe(0);
    expect(localCountView(undefined, undefined).ok).toBe(true);
    expect(localCountView("nope", "nope").matched).toEqual([]);
  });
});

describe("buildCloseoutReport — with no tag information", () => {
  it("leaves `tagged` unknown instead of guessing it", () => {
    const view = localCountView(
      [{ id: "r1", device: "SN-003", type: "RX-100", activity: true }],
      []
    );
    const { outstanding } = buildCloseoutReport({
      count: view,
      receivers,
      consumersByIntent,
    });
    expect(outstanding[0].tagged).toBeNull();
    expect(outstanding[0].holder).toBe("Ana Pérez");
    expect(outstanding[0].chargeable).toBe(true);
  });
});
