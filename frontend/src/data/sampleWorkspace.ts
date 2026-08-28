import type { ChatPayload, Citation, StudioAction, StudioPayload, VaultDocument } from '../types'

type SampleChunk = {
  source: string
  page: number
  text: string
}

export const SAMPLE_DOCUMENTS: VaultDocument[] = [
  {
    id: 'sample-msa',
    filename: 'Master-Services-Agreement.pdf',
    fileType: 'pdf',
    status: 'indexed',
    sizeBytes: 248320,
    createdAt: '2026-08-12T09:14:00.000Z',
  },
  {
    id: 'sample-gdpr',
    filename: 'GDPR-Internal-Guidelines.pptx',
    fileType: 'pptx',
    status: 'indexed',
    sizeBytes: 1102848,
    createdAt: '2026-08-18T16:40:00.000Z',
  },
  {
    id: 'sample-audit',
    filename: 'Q3-Financial-Audit-Memo.txt',
    fileType: 'txt',
    status: 'indexed',
    sizeBytes: 18432,
    createdAt: '2026-08-21T11:02:00.000Z',
  },
]

const CHUNKS: SampleChunk[] = [
  {
    source: 'Master-Services-Agreement.pdf',
    page: 1,
    text: 'This Master Services Agreement is entered into as of 14 March 2026 between Northbridge Legal LLP (“Client”) and Helios Advisory Ltd (“Provider”). The Agreement governs confidential consulting and document review services performed solely on Client premises.',
  },
  {
    source: 'Master-Services-Agreement.pdf',
    page: 3,
    text: 'Either party may terminate this Agreement by providing thirty (30) days written notice. Immediate termination is permitted for material breach that remains uncured for ten (10) days after written notice, or for any unauthorized transfer of Client data off the local workstation.',
  },
  {
    source: 'Master-Services-Agreement.pdf',
    page: 7,
    text: 'Provider shall not transmit, copy, or store Client documents on third-party cloud systems. All processing must remain on encrypted local devices. Liability for a data-residency breach is capped at twelve (12) months of fees, currently GBP 180,000.',
  },
  {
    source: 'GDPR-Internal-Guidelines.pptx',
    page: 2,
    text: 'Personal data of EU data subjects must not leave the local processing environment. Lawful bases used by the firm are contractual necessity and legitimate interests. Transfers to OpenAI, Anthropic, or Google APIs are prohibited without a documented DPIA and SCCs.',
  },
  {
    source: 'GDPR-Internal-Guidelines.pptx',
    page: 5,
    text: 'Retention: executed contracts are retained for 7 years after termination. Interview notes are deleted after 24 months. A data subject access request must be completed within 30 days. The Data Protection Officer is Amara Okonkwo (dpo@northbridge.example).',
  },
  {
    source: 'Q3-Financial-Audit-Memo.txt',
    page: 1,
    text: 'Q3 2026 internal audit of the London compliance practice. Finding F-04: two analysts pasted clause extracts into a public chatbot on 3 July 2026. Remediation: mandate Vault AI (local Ollama) for all contract interrogation by 15 September 2026. Residual risk: Medium.',
  },
  {
    source: 'Q3-Financial-Audit-Memo.txt',
    page: 1,
    text: 'Control testing sampled 40 matters. Exception rate on NDA handling fell from 11% in Q2 to 4% in Q3 after local indexing was introduced. Recommended action: complete source citations on every generated answer before partner review.',
  },
]

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'for',
  'is',
  'are',
  'was',
  'be',
  'by',
  'with',
  'that',
  'this',
  'it',
  'as',
  'at',
  'from',
  'what',
  'who',
  'when',
  'where',
  'how',
  'which',
  'does',
  'do',
])

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token))
}

function rankChunks(query: string): Array<SampleChunk & { score: number }> {
  const terms = tokenize(query)
  return CHUNKS.map((chunk) => {
    const haystack = chunk.text.toLowerCase()
    const score = terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0)
    return { ...chunk, score }
  })
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
}

function toCitations(chunks: SampleChunk[]): Citation[] {
  const seen = new Set<string>()
  const citations: Citation[] = []
  for (const chunk of chunks) {
    const key = `${chunk.source}:${chunk.page}`
    if (seen.has(key)) continue
    seen.add(key)
    citations.push({
      source: chunk.source,
      page: chunk.page,
      snippet: chunk.text,
    })
  }
  return citations
}

export function previewAnswer(query: string): ChatPayload {
  const ranked = rankChunks(query)
  if (!ranked.length || ranked[0].score < 2) {
    return {
      answer: 'Not found in provided documents',
      citations: [],
    }
  }

  const top = ranked.slice(0, 3)
  const lines = top.map(
    (chunk) =>
      `- ${chunk.text} _(Source: ${chunk.source}, p. ${chunk.page})_`,
  )

  return {
    answer: `Based strictly on the indexed sources:\n\n${lines.join('\n\n')}`,
    citations: toCitations(top),
  }
}

export function previewStudio(action: StudioAction): StudioPayload {
  if (action === 'summary') {
    return {
      content: [
        '- Northbridge Legal LLP engaged Helios Advisory Ltd under an MSA dated 14 March 2026 for on-premises confidential review.',
        '- Termination requires 30 days’ written notice, or 10 days after an uncured material breach, including any off-device data transfer.',
        '- Client documents must stay on encrypted local workstations; cloud LLM APIs are prohibited without a DPIA.',
        '- Q3 audit finding F-04 recorded public-chatbot leakage on 3 July 2026; remediation is local Vault AI use by 15 September 2026.',
        '- NDA exception rate improved from 11% in Q2 to 4% in Q3; residual risk remains Medium pending citation discipline.',
      ].join('\n'),
      citations: toCitations([CHUNKS[0], CHUNKS[2], CHUNKS[5]]),
    }
  }

  if (action === 'entities') {
    return {
      content: [
        '### Parties',
        '- Northbridge Legal LLP (Client)',
        '- Helios Advisory Ltd (Provider)',
        '- Amara Okonkwo — Data Protection Officer',
        '',
        '### Dates',
        '- 14 March 2026 — MSA effective date',
        '- 3 July 2026 — chatbot leakage incident',
        '- 15 September 2026 — mandated local-tool remediation deadline',
        '',
        '### Figures & periods',
        '- 30 days termination notice; 10 days cure period',
        '- Liability cap: GBP 180,000 (12 months of fees)',
        '- Contract retention: 7 years; interview notes: 24 months; DSAR: 30 days',
      ].join('\n'),
      citations: toCitations([CHUNKS[0], CHUNKS[1], CHUNKS[4], CHUNKS[5]]),
    }
  }

  return {
    content: [
      '**Q. What notice is required to terminate the MSA?**',
      'A. Thirty (30) days’ written notice, or ten (10) days after an uncured material breach. *(Master-Services-Agreement.pdf, p. 3)*',
      '',
      '**Q. May analysts use cloud LLM APIs on client files?**',
      'A. No. Transfers to OpenAI, Anthropic, or Google APIs are prohibited without a DPIA and SCCs, and the MSA forbids third-party cloud storage. *(GDPR-Internal-Guidelines.pptx, p. 2; Master-Services-Agreement.pdf, p. 7)*',
      '',
      '**Q. Who is the Data Protection Officer?**',
      'A. Amara Okonkwo, dpo@northbridge.example. *(GDPR-Internal-Guidelines.pptx, p. 5)*',
      '',
      '**Q. What was audit finding F-04?**',
      'A. Two analysts pasted clause extracts into a public chatbot on 3 July 2026. *(Q3-Financial-Audit-Memo.txt, p. 1)*',
      '',
      '**Q. What is the liability cap for a data-residency breach?**',
      'A. Twelve months of fees, currently GBP 180,000. *(Master-Services-Agreement.pdf, p. 7)*',
    ].join('\n'),
    citations: toCitations([CHUNKS[1], CHUNKS[2], CHUNKS[3], CHUNKS[4], CHUNKS[5]]),
  }
}

export const PREVIEW_PROMPTS = [
  'What is the termination notice period?',
  'Who are the parties to the MSA?',
  'May we send contracts to a cloud LLM?',
  'What is audit finding F-04?',
]
