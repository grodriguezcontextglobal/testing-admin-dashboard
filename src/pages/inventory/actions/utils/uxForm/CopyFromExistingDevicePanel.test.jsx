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
