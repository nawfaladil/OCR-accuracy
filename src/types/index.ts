export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Field {
  fieldName: string;
  fieldValue: string;
  boundingBox: BoundingBox;
  confidence: number;
  pageNumber: number;
}

export interface Page {
  pageNumber: number;
  fields: Field[];
}

export interface OCRDocument {
  document: {
    filename: string;
    pages: Page[];
  };
}

export interface ViewportCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

