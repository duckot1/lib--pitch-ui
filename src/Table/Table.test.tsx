// @ts-ignore
import React from "react";
import { render } from "@testing-library/react";

import { Table } from "./Table";
import { TableProps } from "./Table.types";

describe("Table Component", () => {
  let props: TableProps;

  beforeEach(() => {
    props = {
      headers: "primary",
      data: ""
    };
  });

  const renderComponent = () => render(<Table {...props} />);

  it("should have primary className with default props", () => {
    const { getByTestId } = renderComponent();

    const testComponent = getByTestId("test-component");

    expect(testComponent).toHaveClass("test-component-primary");
  });

  it("should have secondary className with theme set as secondary", () => {
    props.theme = "secondary";
    const { getByTestId } = renderComponent();

    const testComponent = getByTestId("test-component");

    expect(testComponent).toHaveClass("test-component-secondary");
  });
});