import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { ElementContent } from "hast"
import type {} from "mdast-util-to-hast"
import { toHtml } from "hast-util-to-html"
import { h } from "hastscript"
import { defineMdastPlugin } from "satteri"

const ICONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/icons/callouts",
)

const loadIcon = (name: string) =>
  readFileSync(join(ICONS_DIR, `${name}.svg`), "utf8")
    .replace("<svg", '<svg aria-hidden="true"')
    .replace(/\s+/g, " ")
    .trim()

const VARIANTS: Record<string, string> = {
  note: "info-circle",
  tip: "lightbulb",
  warning: "danger-triangle",
  caution: "shield-warning",
  important: "bell",
}

const icons: Record<string, string> = {}
for (const name of [...new Set(Object.values(VARIANTS)), "alt-arrow-down"]) {
  icons[name] = loadIcon(name)
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const raw = (value: string): ElementContent =>
  ({ type: "raw", value }) as unknown as ElementContent

export const calloutDirective = defineMdastPlugin({
  name: "callout-directive",
  containerDirective(node, ctx) {
    const iconName = VARIANTS[node.name]
    if (!iconName) return

    const first = node.children?.[0]
    const isLabel =
      first?.type === "paragraph" &&
      (first.data as { directiveLabel?: boolean })?.directiveLabel === true

    const title = capitalize(node.name)
    const icon = icons[iconName]
    const chevron = icons["alt-arrow-down"]

    if (isLabel) {
      ctx.setProperty(first, "data", { hName: "summary" })
      ctx.prependChild(first, {
        type: "html",
        value: `${icon}<span>${title}<span> (`,
      })
      ctx.appendChild(first, {
        type: "html",
        value: `)</span></span>${chevron}`,
      })
    } else {
      const summary = toHtml(
        h("summary", [raw(icon), h("span", title), raw(chevron)]),
        { allowDangerousHtml: true },
      )
      ctx.prependChild(node, { type: "html", value: summary })
    }

    const closed = !!node.attributes && "closed" in node.attributes

    ctx.setProperty(node, "data", {
      hName: "details",
      hProperties: {
        dataCallout: node.name,
        open: !closed,
      },
    })
  },
})
