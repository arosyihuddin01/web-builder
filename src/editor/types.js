/*
 JSDoc typedefs for the editor model.
 These are plain JavaScript objects to avoid build steps, but strongly documented.
*/

/**
 * @typedef {Object} Frame
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * @typedef {Object} BaseNode
 * @property {string} id
 * @property {"node"|"group"} type
 * @property {Frame} frame
 * @property {number} zIndex
 * @property {string | null} parentId
 */

/**
 * @typedef {BaseNode & {
 *   type:"node",
 *   // arbitrary render payload can be added by integrators
 *   meta?: Record<string, any>
 * }} VisualNode
 */

/**
 * @typedef {BaseNode & {
 *   type:"group",
 *   children: string[]
 * }} GroupNode
 */

/**
 * @typedef {Object} SerializedState
 * @property {{[id:string]: (VisualNode|GroupNode)}} nodes
 * @property {string[]} order // top-level stacking order by id (z ascending)
 * @property {string[]} selection
 */

/**
 * @typedef {Object} AlignOptions
 * @property {"left"|"right"|"top"|"bottom"|"hcenter"|"vcenter"} mode
 */

export {};
