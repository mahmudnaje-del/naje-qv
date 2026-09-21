declare module 'mammoth' {
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}
