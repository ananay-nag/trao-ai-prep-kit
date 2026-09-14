import { extractAndParseJson } from '../src/llm/client';

describe('extractAndParseJson Parser Suite', () => {
  it('parses pure standard JSON correctly', () => {
    const input = '{"title": "Senior Engineer", "seniority": "Senior", "count": 42}';
    const result = extractAndParseJson<any>(input);
    expect(result).toEqual({ title: 'Senior Engineer', seniority: 'Senior', count: 42 });
  });

  it('parses markdown-fenced JSON with trailing commentary', () => {
    const input = `
\`\`\`json
{
  "company_name": "Acme Corp",
  "summary": "Building world class software."
}
\`\`\`

Here is some extra LLM commentary and notes explaining the analysis:
{ Note: this was generated accurately }
`;
    const result = extractAndParseJson<any>(input);
    expect(result.company_name).toBe('Acme Corp');
    expect(result.summary).toBe('Building world class software.');
  });

  it('parses JSON with trailing commas in arrays and objects', () => {
    const input = `
    {
      "items": [
        "item1",
        "item2",
      ],
      "active": true,
    }
    `;
    const result = extractAndParseJson<any>(input);
    expect(result.items).toEqual(['item1', 'item2']);
    expect(result.active).toBe(true);
  });

  it('handles strings containing curly braces and escaped quotes correctly without miscalculating depth', () => {
    const input = `
    {
      "codeSnippet": "function test() { return \\"nested {curly} braces\\"; }",
      "valid": true
    }
    Extra non-whitespace text after the JSON: [1, 2, 3] { extra: 1 }
    `;
    const result = extractAndParseJson<any>(input);
    expect(result.codeSnippet).toBe('function test() { return "nested {curly} braces"; }');
    expect(result.valid).toBe(true);
  });

  it('parses top-level arrays', () => {
    const input = `
    [
      { "id": "1", "name": "Question 1" },
      { "id": "2", "name": "Question 2" }
    ]
    Some trailing explanations.
    `;
    const result = extractAndParseJson<any>(input);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('1');
  });

  it('parses JSON with smart unicode quotes', () => {
    const input = `
    {
      “title”: “Lead Architect”,
      “level”: 5
    }
    `;
    const result = extractAndParseJson<any>(input);
    expect(result.title).toBe('Lead Architect');
    expect(result.level).toBe(5);
  });
});
