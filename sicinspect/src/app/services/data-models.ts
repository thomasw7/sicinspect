export interface ParsedRequestParameter {
  name: string,
  value: string
}

export interface ParsedRequestPart {
  headers: ParsedRequestParameter[],
  contentId: string
}

export interface ParsedRequest {
  parsedRequestId: string,
  groupingKey: string,
  creationTime: Date,
  isMulti: boolean,
  method: string,
  path: string,
  query: ParsedRequestParameter[],
  headers: ParsedRequestParameter[],
  parts: ParsedRequestPart[]
}
