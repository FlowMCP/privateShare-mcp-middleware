import { PrivateShareMiddleware } from '../src/index.mjs'

describe( 'PrivateShareMiddleware', () => {
    describe( 'health', () => {
        test( 'returns status true', () => {
            const { status } = PrivateShareMiddleware.health()
            
            expect( status ).toBe( true )
        } )
    } )
} )