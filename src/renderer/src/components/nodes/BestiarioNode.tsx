import { useState, type ReactNode } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import { useBestiarioStore } from '../../store/bestiarioStore'
import type { BestiarioCardData } from '../../../../shared/types/board'
import { ATRIBUTOS, ZONAS } from '../../../../shared/types/bestiario'
import { fmt, textoTipo } from '../../bestiario/gerador'
import { CardImage } from './CardImage'
import { CardResizer } from './CardResizer'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [aberta, setAberta] = useState(false)
  return (
    <div className="bcard-secao">
      <button type="button" className="nodrag bcard-secao-titulo" onClick={() => setAberta((a) => !a)}>
        <span className="bcard-seta">{aberta ? '▾' : '▸'}</span> {titulo}
      </button>
      {aberta && <div className="bcard-secao-corpo">{children}</div>}
    </div>
  )
}

function CardHandles() {
  return (
    <>
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
    </>
  )
}

export function BestiarioNode({ id, data, selected }: NodeProps<RFNode>) {
  const cardData = data as BestiarioCardData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)
  const ficha = useBestiarioStore((s) => s.salvos.find((f) => f.id === cardData.refId))

  if (!ficha) {
    return (
      <div className={`card card-bestiario${selected ? ' card-selected' : ''}`}>
        <CardResizer nodeId={id} selected={selected} />
        <CardHandles />
        <div className="card-header card-header-plain">
          <span className="card-title">Ficha removida</span>
        </div>
        <div className="card-body bcard-placeholder">
          Esta ficha não existe mais no bestiário. O card pode ser excluído (Delete).
        </div>
      </div>
    )
  }

  const isMonstro = ficha.dificuldade !== 'aflicao' && ficha.tipo !== 'npc'
  const folegoMax = ficha.folego ?? 0

  function ajustarFolego(delta: number) {
    const atual = cardData.folegoAtual ?? folegoMax
    const novo = Math.max(0, Math.min(folegoMax, atual + delta))
    updateNodeData(id, { folegoAtual: novo })
  }

  function ajustarGuarda(zona: number, delta: number) {
    const guarda = cardData.guardaAtual ?? ficha!.guarda
    if (!guarda) return
    const novo = guarda[zona] + delta
    const total = guarda.reduce((a, b) => a + b, 0) + delta
    if (novo < 0 || novo > 3 || total > 4) return
    updateNodeData(id, { guardaAtual: guarda.map((v, i) => (i === zona ? novo : v)) })
  }

  const guardaAtual = cardData.guardaAtual ?? ficha.guarda

  return (
    <div className={`card card-bestiario bcard-dif-${ficha.dificuldade}${selected ? ' card-selected' : ''}`}>
      <CardResizer nodeId={id} selected={selected} />
      <CardHandles />

      <div className="card-header card-header-plain bcard-header">
        <span className="card-title bcard-nome">
          {ficha.dificuldade === 'aflicao' ? `Aflição: ${ficha.nome}` : ficha.nome}
        </span>
        <span className="bcard-tag">
          {textoTipo(ficha)} · {ficha.contexto}
        </span>
      </div>

      {ficha.imagem && (
        <CardImage
          src={ficha.imagem}
          zoom={cardData.imageZoom ?? 1}
          onZoomChange={(imageZoom) => updateNodeData(id, { imageZoom })}
        />
      )}

      {isMonstro && (
        <div className="bcard-recursos">
          <div className="bcard-recurso">
            <span className="bcard-recurso-nome">Fôlego</span>
            <span className="stat-ctrl">
              <button type="button" className="nodrag step" onClick={() => ajustarFolego(-1)}>
                −
              </button>
              <b>
                {cardData.folegoAtual ?? folegoMax}/{folegoMax}
              </b>
              <button type="button" className="nodrag step" onClick={() => ajustarFolego(1)}>
                +
              </button>
            </span>
            <span className="bcard-recurso-extra">Dano {ficha.dano}</span>
          </div>
          {guardaAtual && (
            <div className="bcard-guarda">
              {ZONAS.map((z, i) => (
                <span key={z} className="bcard-zona">
                  <span className="bcard-zona-nome">{z[0]}</span>
                  <button type="button" className="nodrag step" onClick={() => ajustarGuarda(i, -1)}>
                    −
                  </button>
                  <b>{guardaAtual[i]}</b>
                  <button type="button" className="nodrag step" onClick={() => ajustarGuarda(i, 1)}>
                    +
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-body bcard-body nodrag">
        {isMonstro && (
          <>
            {ficha.aparencia && (
              <Secao titulo="Aparência">
                <p>{ficha.aparencia}</p>
              </Secao>
            )}
            {ficha.atributos && (
              <Secao titulo="Atributos">
                <ul>
                  {ATRIBUTOS.map((a) => (
                    <li key={a}>
                      {a} {fmt(ficha.atributos![a])}
                    </li>
                  ))}
                </ul>
              </Secao>
            )}
            {(ficha.habilidades ?? []).length > 0 && (
              <Secao titulo="Habilidades">
                <ul>
                  {ficha.habilidades!.map((h, i) => (
                    <li key={i}>
                      <strong>{h.nome}</strong> — {h.efeito}
                    </li>
                  ))}
                </ul>
              </Secao>
            )}
            {ficha.manobras && (
              <Secao titulo="Manobras de chefe">
                <p>1 Lance + 1 manobra por rodada: {ficha.manobras.join('; ')}.</p>
              </Secao>
            )}
            {ficha.brecha && (
              <Secao titulo="Brecha">
                <p>{ficha.brecha.texto}</p>
                <p>
                  <strong>2ª camada:</strong> {ficha.brecha.camada2}
                </p>
              </Secao>
            )}
            {(ficha.notas ?? (ficha.nota ? [ficha.nota] : [])).length > 0 && (
              <Secao titulo="Notas">
                <ul>
                  {(ficha.notas ?? [ficha.nota!]).map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </Secao>
            )}
          </>
        )}

        {ficha.dificuldade === 'aflicao' && ficha.aflicao && (
          <>
            <Secao titulo="Concede e preço">
              <p>
                <strong>Concede:</strong> {ficha.aflicao.concede}
              </p>
              <p>
                <strong>Preço:</strong> {ficha.aflicao.preco}
              </p>
            </Secao>
            <Secao titulo="Como se joga">
              <p>{ficha.aflicao.jogo}</p>
            </Secao>
            <Secao titulo="Brecha">
              <p>{ficha.aflicao.brecha}</p>
            </Secao>
          </>
        )}

        {ficha.tipo === 'npc' && (
          <Secao titulo="Detalhes">
            <p>
              <strong>Característica:</strong> {ficha.caracteristica}
            </p>
            <p>
              <strong>Plot:</strong> {ficha.plot}
            </p>
            <p>
              <strong>Aparência:</strong> {ficha.aparencia}
            </p>
          </Secao>
        )}
      </div>
    </div>
  )
}
