class PrivateShareMiddleware {
    static health() { 
        console.log( 'PrivateShareMiddleware is healthy!' )
        
        return { status: true }
    }
}


export { PrivateShareMiddleware }