import { z } from 'zod';

export const PrimitiveTypeSchema = z.enum(['Text', 'Button', 'Image', 'Box', 'Stack', 'Section', 'Grid']);

export const ActionSchema = z.object({
  type: z.literal('link'),
  href: z.string().min(1),
  newTab: z.boolean().optional()
});

export const StyleSchema = z.object({
  color: z.any().optional(),
  backgroundColor: z.any().optional(),
  padding: z.any().optional(),
  paddingTop: z.any().optional(),
  paddingRight: z.any().optional(),
  paddingBottom: z.any().optional(),
  paddingLeft: z.any().optional(),
  margin: z.any().optional(),
  marginTop: z.any().optional(),
  marginRight: z.any().optional(),
  marginBottom: z.any().optional(),
  marginLeft: z.any().optional(),
  gap: z.any().optional(),
  rowGap: z.any().optional(),
  columnGap: z.any().optional(),
  display: z.any().optional(),
  flexDirection: z.any().optional(),
  alignItems: z.any().optional(),
  justifyContent: z.any().optional(),
  gridTemplateColumns: z.any().optional(),
  gridAutoRows: z.any().optional(),
  width: z.any().optional(),
  height: z.any().optional(),
  maxWidth: z.any().optional(),
  maxHeight: z.any().optional(),
  minWidth: z.any().optional(),
  minHeight: z.any().optional(),
  objectFit: z.any().optional(),
  borderRadius: z.any().optional(),
  textAlign: z.any().optional(),
  fontWeight: z.any().optional(),
  fontSize: z.any().optional()
});

// Generic props; specific primitive prop allowlists are enforced by the registry at render-time.
export const PropsSchema = z
  .object({
    id: z.string().optional(),
    className: z.string().optional(),
    testId: z.string().optional(),
    style: StyleSchema.optional(),
    action: ActionSchema.nullable().optional()
  })
  .catchall(z.any());

export const BaseNodeSchema = z.object({ id: z.string().optional(), type: z.string() });

export const PrimitiveNodeSchema = BaseNodeSchema.extend({
  type: PrimitiveTypeSchema,
  props: PropsSchema.nullable().optional(),
  children: z.array(z.any()).nullable().optional()
});

export const ComponentInstanceNodeSchema = BaseNodeSchema.extend({
  type: z.literal('ComponentInstance'),
  component: z.union([z.string(), z.object({ id: z.string() })]),
  props: z.record(z.any()).nullable().optional()
});

export const AnyNodeSchema: z.ZodType<any> = z.union([
  PrimitiveNodeSchema,
  ComponentInstanceNodeSchema,
  BaseNodeSchema
]);

export const RootDocumentSchema: z.ZodType<any> = z.object({
  type: z.union([z.literal('root'), z.literal('document'), z.literal('doc')]),
  children: z.array(z.any())
});

export const ComponentDefinitionSchema = z.object({
  type: PrimitiveTypeSchema,
  displayName: z.string(),
  styleAllowlist: z.array(
    z.enum([
      'color',
      'backgroundColor',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'gap',
      'rowGap',
      'columnGap',
      'display',
      'flexDirection',
      'alignItems',
      'justifyContent',
      'gridTemplateColumns',
      'gridAutoRows',
      'width',
      'height',
      'maxWidth',
      'maxHeight',
      'minWidth',
      'minHeight',
      'objectFit',
      'borderRadius',
      'textAlign',
      'fontWeight',
      'fontSize'
    ])
  ),
  propAllowlist: z.array(z.string())
});

export type PrimitiveType = z.infer<typeof PrimitiveTypeSchema>;
export type AnyNode = z.infer<typeof AnyNodeSchema>;
export type RootDocument = z.infer<typeof RootDocumentSchema>;
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;
