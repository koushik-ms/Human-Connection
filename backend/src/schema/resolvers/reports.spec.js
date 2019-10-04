import { GraphQLClient } from 'graphql-request'
import Factory from '../../seed/factories'
import { host, login } from '../../jest/helpers'
import { neode } from '../../bootstrap/neo4j'

const factory = Factory()
const instance = neode()

describe('report', () => {
  let reportMutation
  let headers
  let returnedObject
  let variables
  let createPostVariables
  let user
  const categoryIds = ['cat9']

  beforeEach(async () => {
    returnedObject = '{ id }'
    variables = {
      resourceId: 'whatever',
      reasonCategory: 'reason-category-dummy',
      reasonDescription: 'Violates code of conduct !!!',
    }
    headers = {}
    user = await factory.create('User', {
      email: 'test@example.org',
      password: '1234',
      id: 'u1',
    })
    await factory.create('User', {
      id: 'u2',
      name: 'abusive-user',
      role: 'user',
      email: 'abusive-user@example.org',
    })
    await instance.create('Category', {
      id: 'cat9',
      name: 'Democracy & Politics',
      icon: 'university',
    })
  })

  afterEach(async () => {
    await factory.cleanDatabase()
  })

  let client
  const action = () => {
    // because of the template `${returnedObject}` the 'gql' tag from 'jest/helpers' is not working here
    reportMutation = `
      mutation($resourceId: ID!, $reasonCategory: String!, $reasonDescription: String!) {
        report( resourceId: $resourceId, reasonCategory: $reasonCategory, reasonDescription: $reasonDescription) ${returnedObject}
      }
    `
    client = new GraphQLClient(host, {
      headers,
    })
    return client.request(reportMutation, variables)
  }

  describe('unauthenticated', () => {
    it('throws authorization error', async () => {
      await expect(action()).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated', () => {
    beforeEach(async () => {
      headers = await login({
        email: 'test@example.org',
        password: '1234',
      })
    })

    describe('invalid resource id', () => {
      it('returns null', async () => {
        await expect(action()).resolves.toEqual({
          report: null,
        })
      })
    })

    describe('valid resource id', () => {
      describe('reported resource is a user', () => {
        beforeEach(async () => {
          variables = {
            ...variables,
            resourceId: 'u2',
          }
        })

        it('returns type "User"', async () => {
          returnedObject = '{ type }'
          await expect(action()).resolves.toEqual({
            report: {
              type: 'User',
            },
          })
        })

        it('returns resource in user attribute', async () => {
          returnedObject = '{ user { name } }'
          await expect(action()).resolves.toEqual({
            report: {
              user: {
                name: 'abusive-user',
              },
            },
          })
        })

        it('returns the submitter', async () => {
          returnedObject = '{ submitter { email } }'
          await expect(action()).resolves.toEqual({
            report: {
              submitter: {
                email: 'test@example.org',
              },
            },
          })
        })

        it('returns a date', async () => {
          returnedObject = '{ createdAt }'
          await expect(action()).resolves.toEqual(expect.objectContaining({
            report: {
              createdAt: expect.any(String),
            },
          }))
        })

        it('returns the reason category', async () => {
          variables = {
            ...variables,
            reasonCategory: 'my-category',
          }
          returnedObject = '{ reasonCategory }'
          await expect(action()).resolves.toEqual({
            report: {
              reasonCategory: 'my-category',
            },
          })
        })

        it('returns the reason description', async () => {
          variables = {
            ...variables,
            reasonDescription: 'My reason!',
          }
          returnedObject = '{ reasonDescription }'
          await expect(action()).resolves.toEqual({
            report: {
              reasonDescription: 'My reason!',
            },
          })
        })
      })

      describe('reported resource is a post', () => {
        beforeEach(async () => {
          await factory.create('Post', {
            author: user,
            id: 'p23',
            title: 'Matt and Robert having a pair-programming',
            categoryIds,
          })
          variables = {
            ...variables,
            resourceId: 'p23',
          }
        })

        it('returns type "Post"', async () => {
          returnedObject = '{ type }'
          await expect(action()).resolves.toEqual({
            report: {
              type: 'Post',
            },
          })
        })

        it('returns resource in post attribute', async () => {
          returnedObject = '{ post { title } }'
          await expect(action()).resolves.toEqual({
            report: {
              post: {
                title: 'Matt and Robert having a pair-programming',
              },
            },
          })
        })

        it('returns null in user attribute', async () => {
          returnedObject = '{ user { name } }'
          await expect(action()).resolves.toEqual({
            report: {
              user: null,
            },
          })
        })
      })

      /* An der Stelle würde ich den p23 noch mal prüfen, diesmal muss aber eine error meldung kommen.
           At this point I would check the p23 again, but this time there must be an error message. */

      describe('reported resource is a comment', () => {
        beforeEach(async () => {
          createPostVariables = {
            id: 'p1',
            title: 'post to comment on',
            content: 'please comment on me',
            categoryIds,
          }
          await factory.create('Post', { ...createPostVariables, author: user })
          await factory.create('Comment', {
            author: user,
            postId: 'p1',
            id: 'c34',
            content: 'Robert getting tired.',
          })
          variables = {
            ...variables,
            resourceId: 'c34',
          }
        })

        it('returns type "Comment"', async () => {
          returnedObject = '{ type }'
          await expect(action()).resolves.toEqual({
            report: {
              type: 'Comment',
            },
          })
        })

        it('returns resource in comment attribute', async () => {
          returnedObject = '{ comment { content } }'
          await expect(action()).resolves.toEqual({
            report: {
              comment: {
                content: 'Robert getting tired.',
              },
            },
          })
        })
      })

      /* An der Stelle würde ich den c34 noch mal prüfen, diesmal muss aber eine error meldung kommen.
           At this point I would check the c34 again, but this time there must be an error message. */

      describe('reported resource is a tag', () => {
        beforeEach(async () => {
          await factory.create('Tag', {
            id: 't23',
          })
          variables = {
            ...variables,
            resourceId: 't23',
          }
        })

        it('returns null', async () => {
          await expect(action()).resolves.toEqual({
            report: null,
          })
        })
      })

      /* An der Stelle würde ich den t23 noch mal prüfen, diesmal muss aber eine error meldung kommen.
           At this point I would check the t23 again, but this time there must be an error message. */
    })
  })
})
