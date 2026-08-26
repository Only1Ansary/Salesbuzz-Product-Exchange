import { IColumns, DataTypes, ControlTypes } from 'bi-interfaces';

export const productColumns: IColumns[] = [
  {
    DomID: undefined,
    Name: 'ProductID',
    DisplayName: 'Product ID',
    DataType: DataTypes.NUMERIC,
    IsEditable: false,
    IsFilterable: true,
    IsVisible: true,
    Width: 120
  },
  {
    DomID: undefined,
    Name: 'ProductName',
    DisplayName: 'Product Name',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 300
  },
  {
    DomID: undefined,
    Name: 'Price',
    DisplayName: 'Price',
    DataType: DataTypes.NUMERIC,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Number,
    Precision: 2,
    Width: 150
  }
];