# QuickConnect

Hero Section Layout — Updated (Important)

Create a full-screen, two-column hero section with the following exact arrangement:

LEFT SIDE — 45% width: QuickConnect Content

Small label: THE KNOWLEDGE HANDOVER PLATFORM

Main heading: Don't Let Valuable Knowledge Walk Away.

Highlight "Knowledge Walk Away" using QuickConnect's existing accent color.

Description: When people leave, projects shouldn't lose their knowledge. QuickConnect captures scattered information, connects project context and makes every handover seamless.

Primary CTA: Explore QuickConnect

Secondary CTA: See How It Works

Supporting statement: One workspace. Complete context. Seamless transitions.

RIGHT SIDE — 55% width: Interactive 3D Globe

Large interactive gallery globe matching the supplied Framer reference.

Position it prominently on the right.

Include smooth auto-rotation and mouse/touch drag interaction.

Use individual 3D surface panels so they can separate during the scroll effect.

Keep enough space around the globe for the breakup animation.

Scroll behavior

As the user scrolls down:

The globe initially remains fully assembled.

Its individual panels gradually separate.

Pieces move outward in different directions with slight rotations.

The pieces gradually fade away.

The transition leads naturally into the next section.

The breakup must be scroll-controlled and reversible when scrolling upward.

Responsive behavior

Desktop: Content on the left, globe on the right.

Tablet: Maintain the two-column layout when space allows.

Mobile: Stack content and globe vertically, with the content first and globe below it.

Critical: Do not reverse this arrangement. Content must always be on the left and the globe on the right on desktop. Continue using the exact existing QuickConnect color palette, typography, buttons and design system.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
