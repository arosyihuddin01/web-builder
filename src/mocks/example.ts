import type { RootDocument } from '@src/renderer/recursiveRenderer';

export const exampleDoc: RootDocument = {
  type: 'doc',
  children: [
    {
      type: 'Section',
      props: {
        style: { padding: 24, maxWidth: 960, margin: '0 auto' }
      },
      children: [
        {
          type: 'Stack',
          props: { direction: 'vertical', style: { gap: 16 } },
          children: [
            {
              type: 'Text',
              props: {
                content: 'Renderer demo',
                style: { fontSize: 28, fontWeight: 700 }
              }
            },
            {
              type: 'Text',
              props: {
                content:
                  'This page is rendered from JSON using a minimal allowlisted primitive registry and recursive renderer.',
                style: { color: '#4b5563' }
              }
            },
            {
              type: 'Grid',
              props: { columns: 2, style: { gap: 16 } },
              children: [
                {
                  type: 'Box',
                  props: {
                    style: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }
                  },
                  children: [
                    {
                      type: 'Text',
                      props: { content: 'Box + Text', style: { fontWeight: 600 } }
                    },
                    {
                      type: 'Text',
                      props: { content: 'Compose primitives to build UI.' }
                    }
                  ]
                },
                {
                  type: 'Box',
                  props: {
                    style: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 }
                  },
                  children: [
                    { type: 'Text', props: { content: 'A button with link action' } },
                    {
                      type: 'Button',
                      props: {
                        label: 'Open Next.js',
                        variant: 'primary',
                        action: { type: 'link', href: 'https://nextjs.org', newTab: true },
                        style: { marginTop: 8 }
                      }
                    }
                  ]
                }
              ]
            },
            {
              type: 'Image',
              props: {
                src: 'https://picsum.photos/800/240',
                alt: 'Random image',
                style: { width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }
              }
            },
            {
              type: 'ComponentInstance',
              component: 'SampleCard',
              props: null
            }
          ]
        }
      ]
    }
  ]
};
