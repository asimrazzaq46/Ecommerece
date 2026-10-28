import React from "react";
import {render,screen,fireEvent} from "@testing-library/react";
import Pagination from "./Pagination";
test("both directions stay disabled while a page request is pending",()=>{const change=jest.fn();render(<Pagination activePage={2} itemsCountPerPage={12} totalItemsCount={60} onChange={change} disabled/>);fireEvent.click(screen.getByRole("button",{name:"Next"}));expect(change).not.toHaveBeenCalled();expect(screen.getByRole("button",{name:"Previous"})).toBeDisabled();});
test("pagination exposes its purpose and keeps navigation within bounds",()=>{const change=jest.fn();render(<Pagination activePage={1} itemsCountPerPage={12} totalItemsCount={60} onChange={change}/>);expect(screen.getByRole("navigation",{name:"Pagination"})).toHaveClass("pagination-controls");expect(screen.getByRole("button",{name:"Previous"})).toBeDisabled();fireEvent.click(screen.getByRole("button",{name:"Next"}));expect(change).toHaveBeenCalledWith(2);});
