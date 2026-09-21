import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import CopyFromExistingDevicePanel from "./CopyFromExistingDevicePanel";

const OPTIONS = {
  category_name: ["Audio", "Connectivity"],
  item_group: ["PL6 RF Receiver"],
  brand: ["Congress Audio"],
};

const Harness = ({ options = OPTIONS, ...props }) => {
  const { control } = useForm({
    defaultValues: {
      reference_category_name: "",
      reference_item_group: "",
      reference_brand: "",
    },
  });
  return (
    <CopyFromExistingDevicePanel
      control={control}
      retrieveItemOptions={(key) => options[key] ?? []}
      onSearch={vi.fn()}
      onClear={vi.fn()}
      copiedFrom={null}
      {...props}
    />
  );
};

const trigger = () => screen.getByRole("button", { name: /copy details from a device/i });

describe("CopyFromExistingDevicePanel", () => {
  it("arranca colapsado — es un atajo, no un paso del formulario", () => {
    render(<Harness />);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Copy details" })).not.toBeInTheDocument();
  });

  it("se despliega y se vuelve a plegar desde el encabezado", () => {
    render(<Harness />);
    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Copy details" })).toBeInTheDocument();

    fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  // Sin inventario cargado no hay de dónde copiar. Mostrar el panel ahí sería
  // ofrecer un atajo que no puede funcionar.
  it("no se renderiza cuando la compañía todavía no tiene inventario", () => {
    const { container } = render(
      <Harness options={{ category_name: [], item_group: [], brand: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("deshabilita Copy details hasta que haya al menos un criterio", () => {
    render(<Harness />);
    fireEvent.click(trigger());

    expect(screen.getByRole("button", { name: "Copy details" })).toBeDisabled();
    expect(screen.getByText(/fill in at least one of the three/i)).toBeInTheDocument();
  });

  describe("con una copia ya aplicada", () => {
    const copiedFrom = { serial_number: "A1", matchCount: 1 };

    // Los campos de abajo ya vienen rellenados: si el panel se pliega sin decir
    // nada, el usuario ve datos que no escribió y no sabe de dónde salieron.
    it("al plegarse, el encabezado conserva de dónde vinieron los datos", () => {
      render(<Harness copiedFrom={copiedFrom} />);
      fireEvent.click(trigger());
      expect(screen.getByText("Details copied from A1")).toBeInTheDocument();
    });

    it("no repite el mismo mensaje en el encabezado y en la alerta", () => {
      render(<Harness copiedFrom={copiedFrom} />);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(screen.getAllByText("Details copied from A1")).toHaveLength(1);
    });

    it("avisa cuando varias unidades coincidieron y ganó la primera", () => {
      render(<Harness copiedFrom={{ serial_number: "A1", matchCount: 4 }} />);
      expect(screen.getByText(/4 devices matched/i)).toBeInTheDocument();
    });

    it("deja Undo al alcance también con el panel plegado", () => {
      const onClear = vi.fn();
      render(<Harness copiedFrom={copiedFrom} onClear={onClear} />);

      fireEvent.click(trigger()); // se abre solo tras copiar; lo plegamos
      expect(trigger()).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(screen.getByRole("button", { name: /undo/i }));
      expect(onClear).toHaveBeenCalled();
    });
  });
});

/* El panel es el único sitio donde se ve si el filtrado llega a la UI: la regla
   está probada en referenceLookup, esto comprueba que el panel la usa y que le
   pasa los criterios correctos — los otros dos, nunca el propio. */
describe("los tres filtros se angostan entre sí", () => {
  const INVENTORY = [
    { category_name: "Laptops", item_group: "XPS 15", brand: "Dell" },
    { category_name: "Cleaning", item_group: "Disinfectant wipes", brand: "Ticonderoga" },
  ];

  /** `retrieveItemOptions` tal como lo dan los hooks reales, sobre un inventario
   *  de dos unidades que no comparten nada. */
  const retrieve = vi.fn((field, narrowBy) => {
    const scoped = !narrowBy
      ? INVENTORY
      : INVENTORY.filter(
          (item) =>
            (!narrowBy.category || item.category_name === narrowBy.category) &&
            (!narrowBy.itemGroup || item.item_group === narrowBy.itemGroup) &&
            (!narrowBy.brand || item.brand === narrowBy.brand),
        );
    return [...new Set(scoped.map((item) => item[field]))];
  });

  const renderOpen = (defaults) => {
    retrieve.mockClear();
    const Open = () => {
      const { control } = useForm({
        defaultValues: {
          reference_category_name: "",
          reference_item_group: "",
          reference_brand: "",
          ...defaults,
        },
      });
      return (
        <CopyFromExistingDevicePanel
          control={control}
          retrieveItemOptions={retrieve}
          onSearch={vi.fn()}
          onClear={vi.fn()}
          copiedFrom={null}
        />
      );
    };
    render(<Open />);
    fireEvent.click(trigger());
  };

  const criteriaFor = (field) =>
    retrieve.mock.calls.find((call) => call[0] === field)?.[1];

  it("pide cada lista con los otros dos criterios, nunca con el propio", () => {
    renderOpen({ reference_brand: "Dell" });

    expect(criteriaFor("category_name")).toEqual({
      category: "",
      itemGroup: "",
      brand: "Dell",
    });
    expect(criteriaFor("item_group")).toEqual({
      category: "",
      itemGroup: "",
      brand: "Dell",
    });
    /* La propia marca va en blanco: si se filtrara por sí misma, Dell sería la
       única opción y no habría forma de cambiarla. */
    expect(criteriaFor("brand")).toEqual({
      category: "",
      itemGroup: "",
      brand: "",
    });
  });

  it("deja de ofrecer la combinación que Fredrik señaló", () => {
    renderOpen({ reference_category_name: "Laptops" });

    const groups = retrieve.mock.results.find(
      (result, index) => retrieve.mock.calls[index][0] === "item_group",
    )?.value;

    expect(groups).toEqual(["XPS 15"]);
    expect(groups).not.toContain("Disinfectant wipes");
  });

  it("sin nada elegido pide las listas completas", () => {
    renderOpen({});

    expect(criteriaFor("brand")).toEqual({
      category: "",
      itemGroup: "",
      brand: "",
    });
  });
});
