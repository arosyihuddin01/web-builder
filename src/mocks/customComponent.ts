// A sample custom component expressed as JSON using primitives.
// The preview route will resolve a ComponentInstance with id "SampleCard" to this tree.
import type { UnknownJSON } from '@src/renderer/recursiveRenderer';

export const sampleCustomComponent: UnknownJSON = {
  type: 'Box',
  props: {
    style: { backgroundColor: '#eef2ff', padding: 16, borderRadius: 8 }
  },
  children: [
    {
      type: 'Stack',
      props: { direction: 'horizontal', style: { gap: 12, alignItems: 'center' } },
      children: [
        {
          type: 'Image',
          props: {
            src: 'https://picsum.photos/seed/pic/96/96',
            alt: 'Avatar',
            style: { width: 64, height: 64, borderRadius: 9999, objectFit: 'cover' }
          }
        },
        {
          type: 'Stack',
          props: { direction: 'vertical', style: { gap: 4 } },
          children: [
            { type: 'Text', props: { content: 'SampleCard', style: { fontWeight: 700 } } },
            {
              type: 'Text',
              props: { content: 'This is a custom component resolved at render-time.' }
            }
          ]
        }
      ]
    }
  ]
};
