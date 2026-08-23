import { IColumns, DataTypes, ControlTypes } from 'bi-interfaces';

export const productColumns: IColumns[] = [
  {
    Name: 'ProductName',
    DisplayName: 'Product Name',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 200
  } as IColumns,
  {
    Name: 'Price',
    DisplayName: 'Price',
    DataType: DataTypes.NUMERIC,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Number,
    Width: 100
  } as IColumns
];