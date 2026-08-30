import type { ChatMessage, ChatPayload, Citation, StudioAction, StudioPayload, VaultDocument } from '../types'

type SampleChunk = {
  source: string
  page: number
  text: string
}

export const SAMPLE_DOCUMENTS: VaultDocument[] = [
  {
    id: 'sample-hr',
    filename: 'HR_Policy.pdf',
    fileType: 'pdf',
    status: 'indexed',
    createdAt: '2026-08-12T09:14:00.000Z',
  },
  {
    id: 'sample-contract',
    filename: 'Standard_Contract.pdf',
    fileType: 'pdf',
    status: 'indexed',
    createdAt: '2026-08-18T16:40:00.000Z',
  },
  {
    id: 'sample-manual',
    filename: 'Product_Manual.pdf',
    fileType: 'pdf',
    status: 'indexed',
    createdAt: '2026-08-21T11:02:00.000Z',
  },
]

export const SAMPLE_THREAD: ChatMessage[] = [
  {
    id: 'sample-answer',
    role: 'assistant',
    content: 'The notice period is 30 calendar days.',
    citations: [
      {
        source: 'Standard_Contract.pdf',
        page: 3,
        snippet:
          'Either party may terminate this Agreement by providing thirty (30) calendar days written notice.',
      },
    ],
    createdAt: '2026-08-28T09:00:00.000Z',
  },
]

const CHUNKS: SampleChunk[] = [
  {
    source: 'Standard_Contract.pdf',
    page: 1,
    text: 'This Standard Contract is entered into as of 14 March 2026 between Northbridge Legal LLP (“Client”) and Helios Advisory Ltd (“Provider”).',
  },
  {
    source: 'Standard_Contract.pdf',
    page: 3,
    text: 'Either party may terminate this Agreement by providing thirty (30) calendar days written notice. Immediate termination is permitted for material breach that remains uncured for ten (10) days after written notice.',
  },
  {
    source: 'Standard_Contract.pdf',
    page: 7,
    text: 'Provider shall not transmit Client documents to third-party cloud systems. All processing must remain on encrypted local devices. Liability for a data-residency breach is capped at twelve (12) months of fees, currently GBP 180,000.',
  },
  {
    source: 'HR_Policy.pdf',
    page: 2,
    text: 'Personal data of employees must not leave the local processing environment. Transfers to OpenAI, Anthropic, or Google APIs are prohibited without a documented DPIA.',
  },
  {
    source: 'HR_Policy.pdf',
    page: 5,
    text: 'Executed contracts are retained for 7 years after termination. A data subject access request must be completed within 30 days. The Data Protection Officer is Amara Okonkwo.',
  },
  {
    source: 'Product_Manual.pdf',
    page: 4,
    text: 'Vault AI indexes PDF, PPTX, and TXT files locally. Answers must include source citations before partner review. Public chatbots are not an approved tool for contract interrogation.',
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
  const noticeChunk = CHUNKS.find(
    (chunk) => chunk.source === 'Standard_Contract.pdf' && chunk.page === 3,
  )
  if (/notice period/i.test(query) && noticeChunk) {
    return {
      answer: 'The notice period is 30 calendar days.',
      citations: toCitations([noticeChunk]),
    }
  }

  const ranked = rankChunks(query)
  if (!ranked.length || ranked[0].score < 2) {
    return {
      answer: 'Not found in provided documents',
      citations: [],
    }
  }

  const top = ranked.slice(0, 3)
  const best = top[0]
  if (!best) {
    return {
      answer: 'Not found in provided documents',
      citations: [],
    }
  }

  return {
    answer: best.text,
    citations: toCitations(top),
  }
}

export function previewStudio(action: StudioAction): StudioPayload {
  if (action === 'summary') {
    return {
      content: [
        '- Standard_Contract.pdf sets a 30 calendar day notice period and forbids off-device cloud transfer.',
        '- HR_Policy.pdf keeps employee data local and names Amara Okonkwo as DPO.',
        '- Product_Manual.pdf requires source citations on every generated answer.',
        '- Cloud LLM APIs are not an approved processing path.',
        '- Liability for a data-residency breach is capped at GBP 180,000.',
      ].join('\n'),
      citations: toCitations([CHUNKS[1], CHUNKS[3], CHUNKS[5]]),
    }
  }

  if (action === 'entities') {
    return {
      content: [
        '- Northbridge Legal LLP',
        '- Helios Advisory Ltd',
        '- Amara Okonkwo',
        '- 14 March 2026',
        '- 30 calendar days',
        '- GBP 180,000',
      ].join('\n'),
      citations: toCitations([CHUNKS[0], CHUNKS[1], CHUNKS[4]]),
    }
  }

  return {
    content: [
      '**Q. What is the notice period?**',
      'A. 30 calendar days.',
      '',
      '**Q. May we send contracts to a cloud LLM?**',
      'A. No.',
      '',
      '**Q. Who is the Data Protection Officer?**',
      'A. Amara Okonkwo.',
    ].join('\n'),
    citations: toCitations([CHUNKS[1], CHUNKS[3], CHUNKS[4]]),
  }
}

export const PREVIEW_PROMPTS = [
  'What is the notice period?',
  'May we send contracts to a cloud LLM?',
]
