import { NodeResizer } from '@xyflow/react'
import { useBoardStore } from '../../store/boardStore'

interface CardResizerProps {
  nodeId: string
  selected?: boolean
  minWidth?: number
  minHeight?: number
}

export function CardResizer({ nodeId, selected, minWidth = 160, minHeight = 90 }: CardResizerProps) {
  const updateNodeGeometry = useBoardStore((s) => s.updateNodeGeometry)

  return (
    <NodeResizer
      isVisible={selected}
      minWidth={minWidth}
      minHeight={minHeight}
      lineClassName="card-resize-line"
      handleClassName="card-resize-handle"
      onResizeEnd={(_event, params) => {
        updateNodeGeometry(nodeId, {
          width: params.width,
          height: params.height,
          x: params.x,
          y: params.y,
        })
      }}
    />
  )
}
