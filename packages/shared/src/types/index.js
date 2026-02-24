/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string=} email
 * @property {string=} displayName
 * @property {string[]=} roles
 * @property {string=} stripeCustomerId
 */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string=} email
 * @property {string=} phone
 * @property {number=} createdAt
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {'todo'|'doing'|'done'=} status
 * @property {number=} dueAt
 * @property {number=} createdAt
 */

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {number=} createdAt
 */

/**
 * @typedef {Object} FileItem
 * @property {string} id
 * @property {string} name
 * @property {string=} contentType
 * @property {string=} url
 * @property {number=} createdAt
 */

/**
 * @typedef {Object} Plan
 * @property {string} id
 * @property {string} name
 * @property {string=} stripePriceId
 */

export {};
