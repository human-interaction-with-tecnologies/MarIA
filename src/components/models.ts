export interface Author {
  given: string
  family: string
}

export interface BibEntry {
  DOI: string
  URL: string
  abstract: string
  author: Author[]
  'citation-key': string
  id: string
  issued: {
    'date-parts': Array<number[]>
  },
  keyword: string
  title: string
  type: string
}
