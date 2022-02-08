/**

Copyright 2021 Forestry.io Holdings, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import React from 'react'
import { useTina } from './edit-state'
import { TinaDataContext } from '@tinacms/sharedctx'

const query = `{}`
const variables = { filename: 'neat.md' }

const CreateDummyEditProvider = (isLoading, payload) => {
  const setRequest = jest.fn()

  return {
    setRequest,
    component: ({ children }) => (
      <TinaDataContext.Provider
        value={{
          setRequest,
          isLoading: isLoading,
          state: { payload: payload },
        }}
      >
        {children}
      </TinaDataContext.Provider>
    ),
  }
}

describe('useTina', () => {
  describe('with prod context', () => {
    it('renders original text on first render', () => {
      const { queryByText } = render(<DummyComponent />)

      const text = queryByText(/original/)

      expect(text).toBeInTheDocument()
    })
  })
  describe('with edit context', () => {
    describe('when loading', () => {
      const Foo = CreateDummyEditProvider(true, { title: 'blah' })
      it('renders original text', () => {
        const { queryByText } = render(
          <Foo.component>
            <DummyComponent />
          </Foo.component>
        )

        const text = queryByText(/original/)

        expect(text).toBeInTheDocument()
      })
    })

    describe('when not loading', () => {
      const Foo = CreateDummyEditProvider(false, { title: 'blah' })
      it('renders original text for 1st frame', async () => {
        const { queryByText, rerender } = render(
          <Foo.component>
            <DummyComponent />
          </Foo.component>
        )

        const text = queryByText(/original/)

        expect(text).toBeInTheDocument()

        await waitFor(() => expect(queryByText(/blah/)).toBeInTheDocument(), {
          timeout: 1,
        })
      })
    })

    describe('on load', () => {
      it('sets query on providers', async () => {
        const Foo = CreateDummyEditProvider(false, { title: 'blah' })

        const { rerender } = render(
          <Foo.component>
            <DummyComponent />
          </Foo.component>
        )

        //sanity check that second render doesn't recall
        rerender(
          <Foo.component>
            <DummyComponent />
          </Foo.component>
        )

        expect(Foo.setRequest).toHaveBeenCalledTimes(1)
        expect(Foo.setRequest).toHaveBeenCalledWith({ query, variables })
      })
    })

    describe('on unmount', () => {
      it('clears query on providers', async () => {
        const Foo = CreateDummyEditProvider(false, { title: 'blah' })

        const { unmount } = render(
          <Foo.component>
            <DummyComponent />
          </Foo.component>
        )

        unmount()

        expect(Foo.setRequest).toHaveBeenCalledTimes(2)
        expect(Foo.setRequest).toHaveBeenCalledWith(undefined)
      })
    })
  })
})

const DummyComponent = () => {
  const { data } = useTina({
    query,
    variables,
    data: {
      title: 'original',
    },
  })

  return <div>{data.title}</div>
}