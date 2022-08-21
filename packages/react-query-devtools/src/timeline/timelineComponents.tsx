import * as React from 'react'

import {
  ReactQueryDevtoolsQueryEventGroup,
  ReactQueryQueryEvent,
} from './useTimelineEvents'

import { computeObserverCountBoxes, computeQueryBoxes } from './utils'

export type TooltipOptions = {
  x: number
  y: number
  content: React.ReactNode
}

type ActionType = NonNullable<ReactQueryQueryEvent['actionType']>

const ActionColors: Record<ActionType, string> = {
  continue: '#7BFFA0',
  error: '#FF4154',
  failed: '#BE0027',
  invalidate: '#FF9CA0',
  fetch: '#006BFF',
  pause: '#D5F0FF',
  setState: '#B53DD1',
  success: '#00AB52',
}

function getActionColor(action: ActionType | null) {
  return action && action in ActionColors ? ActionColors[action] : '#000000'
}

interface SVGQueryTimelineProps extends React.ComponentProps<'div'> {
  query: ReactQueryDevtoolsQueryEventGroup
  timeRange: { start: Date; end: Date | null }
  zoom: number
  offset: number
  setTooltip: (options: TooltipOptions | null) => void
}

function useTooltip({
  setTooltip,
}: {
  setTooltip: (options: TooltipOptions | null) => void
}) {
  const handleMouseMove = (content: string) => (e: React.MouseEvent) => {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      content,
    })
  }
  const handleMouseLeave = () => {
    setTooltip(null)
  }

  return {
    getTooltipProps(content: string) {
      return {
        onMouseMove: handleMouseMove(content),
        onMouseLeave: handleMouseLeave,
      }
    },
  }
}

export const SVGQueryTimeline = React.forwardRef<
  HTMLDivElement,
  SVGQueryTimelineProps
>(function SVGQueryTimeline(props, ref) {
  const { query, timeRange, zoom, offset, setTooltip, ...divProps } = props
  const boxes = React.useMemo(() => {
    return computeQueryBoxes(query, timeRange)
  }, [query, timeRange])

  const scaleX = (x: Date) => {
    const translatedX = x.getTime() - timeRange.start.getTime()
    return translatedX / zoom
  }

  const { getTooltipProps } = useTooltip({ setTooltip })

  return (
    <div
      ref={ref}
      {...divProps}
      style={{ height: 30, padding: '4px 8px', flex: 1, position: 'relative' }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute',
          left: offset,
        }}
      >
        {boxes.map((item) => {
          const counts = computeObserverCountBoxes(item)

          return (
            <g key={item.startAt.getTime()}>
              <rect
                x={scaleX(item.startAt)}
                y="4"
                width={scaleX(item.endAt) - scaleX(item.startAt)}
                height="22"
                fill="#8798bf42"
                {...getTooltipProps(`Cache time: ${item.cacheTime}ms`)}
              />
              {counts.map((count) => (
                <React.Fragment key={count.start.getTime()}>
                  <rect
                    key={count.start.getTime()}
                    x={scaleX(count.start)}
                    y="4"
                    width={scaleX(count.end) - scaleX(count.start)}
                    height="22"
                    fill="#375c8d"
                    {...getTooltipProps(`${count.count} observer(s)`)}
                  />
                  <text
                    x={(scaleX(count.start) + scaleX(count.end)) / 2}
                    y="20"
                    fill="white"
                    fontSize="14"
                  >
                    {count.count}
                  </text>
                </React.Fragment>
              ))}
              {item.updates.map((update, i) => (
                <React.Fragment key={i}>
                  <circle
                    cx={scaleX(update.at)}
                    cy="2"
                    r="2"
                    fill={getActionColor(update.action)}
                  >
                    <title>{update.action}</title>
                  </circle>
                  <rect
                    x={scaleX(update.at) - 0.25}
                    y="4"
                    width="1"
                    height="22"
                    fill={getActionColor(update.action)}
                  >
                    <title>{update.action}</title>
                  </rect>
                </React.Fragment>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
})
