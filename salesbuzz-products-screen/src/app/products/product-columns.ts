import { IColumns, DataTypes, ControlTypes } from 'bi-interfaces';

export const productColumns: IColumns[] = [
  {
    DomID: undefined,
    Name: 'OrderId',
    DisplayName: 'Order ID',
    DataType: DataTypes.NUMERIC,
    IsEditable: false,
    IsFilterable: true,
    IsVisible: true,
    Width: 120
  },
  {
    DomID: undefined,
    Name: 'OriginalProduct',
    DisplayName: 'Original Product',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 200
  },
  {
    DomID: undefined,
    Name: 'OriginalQuantity',
    DisplayName: 'Original Quantity',
    DataType: DataTypes.NUMERIC,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Number,
    Precision: 0,
    Width: 150
  },
  {
    DomID: undefined,
    Name: 'ReplacementProduct',
    DisplayName: 'Replacement Product',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 200
  },
  {
    DomID: undefined,
    Name: 'ReplacementQuantity',
    DisplayName: 'Replacement Quantity',
    DataType: DataTypes.NUMERIC,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Number,
    Precision: 0,
    Width: 170
  },
  {
    DomID: undefined,
    Name: 'Reason',
    DisplayName: 'Reason',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 250
  },
  {
    DomID: undefined,
    Name: 'Status',
    DisplayName: 'Status',
    DataType: DataTypes.Text,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Text,
    Width: 120
  },
  {
    DomID: undefined,
    Name: 'Date',
    DisplayName: 'Date',
    DataType: DataTypes.Date,
    IsEditable: true,
    IsFilterable: true,
    IsVisible: true,
    controlType: ControlTypes.Date,
    Width: 150
  }
];