import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Effect, Learning, Prioritization, Qualification } from './App'
import { emptyQualification, type Initiative } from './lifecycle'
import { defaultSteeringProfile, qualificationRequirements, type QualificationState } from './scenario'

const complete = Object.fromEntries(qualificationRequirements.map(requirement => [requirement, true])) as QualificationState
const initiative = (id = 'UTM-002'): Initiative => ({
  id,
  title: 'Ofullständiga ansökningar',
  problem: 'Ansökningar behöver kompletteras.',
  initiator: 'Eksjö',
  participants: ['Eksjö', 'Sävsjö'],
  isDemo: true,
  area: 'Samhällsprocess',
  effect: '−14 dagar',
  evidence: 'Medel',
  time: '2–4 mån',
  capacity: 1,
  risk: 'Låg',
  scale: 'Medel',
  members: '2/5',
  recommendation: 'STARTA',
  qualification: complete,
  selectedForPrioritization: false,
  decision: null,
  implementationStatus: 'EJ_STARTAD',
})

describe('initiativbunden visning', () => {
  it('visar endast aktiv kontext och ärliga placeholders i Effekt och Lärande', () => {
    const item = initiative()
    const html = renderToStaticMarkup(<><Effect initiative={item}/><Learning initiative={item}/></>)
    expect(html).toContain(item.id)
    expect(html).toContain(item.title)
    expect(html).toContain(item.initiator)
    expect(html).toContain('Effektuppföljning utvecklas i senare steg.')
    expect(html).toContain('Lärande och återbruk utvecklas i senare steg.')
    expect(html).not.toContain('5 700 h/år')
    expect(html).not.toContain('MÖNSTER I 18 AVSLUTADE INITIATIV')
  })

  it('visar inte UTM-001:s dokumentationsunderlag för ett annat demo-initiativ', () => {
    const html = renderToStaticMarkup(<Qualification go={vi.fn()} initiative={initiative()} setInitiative={vi.fn()} perspective="Eksjö – lokalt perspektiv"/>)
    expect(html).toContain('Underlag saknas')
    expect(html).not.toContain('42 min/dag')
    expect(html).not.toContain('Standardiserat informationsflöde')
  })

  it('låter lokal/federerad vy rendera samma initiativdeltagande utan analysurval eller mutation', () => {
    const item = initiative()
    const before = structuredClone(item)
    const common = { initiatives: [item], setInitiatives: vi.fn(), activeInitiativeId: item.id, setActiveInitiativeId: vi.fn(), weights: defaultSteeringProfile, organization: 'Eksjö' as const }
    const local = renderToStaticMarkup(<Prioritization {...common} federatedView={false}/>)
    const federated = renderToStaticMarkup(<Prioritization {...common} federatedView/>)
    expect(local).toContain('Eksjö – lokalt perspektiv')
    expect(federated).toContain('Federerad vy – samlad bild för deltagande organisationer')
    expect(item).toEqual(before)
    expect(item.participants).toEqual(['Eksjö', 'Sävsjö'])
    expect(item).not.toHaveProperty('federatedSelection')
  })

  it('behåller tomt kvalificeringsstate för kontrollinitiativet', () => {
    expect(emptyQualification()).not.toEqual(complete)
  })
})
