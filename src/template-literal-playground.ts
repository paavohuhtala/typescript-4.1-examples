
// String literals can be combined...

type HelloWorld = "Hello World"
const helloWorld: HelloWorld = `Hello World`

type Basic = `${'Hello'} ${'World'}!`

type CssMargin = `margin-${'left' | 'right' | 'top' | 'bottom'}`
type Direction = 'left' | 'right' | 'top' | 'bottom'
type CssMargin2 = `margin-${Direction}`

type SecureUrl = `https://${string}` 
const importantServiceEndpoint: SecureUrl = "https://www.secret-backend.example.com"

function sendPrivateInformationTo(url: SecureUrl) { }
sendPrivateInformationTo("https://www.secret-backend.example.com/api/v1/change-password")

// And taken apart...

type ExtractDirection<T extends string> =
    T extends `${string}-${infer D}` ? D : never

type Left = ExtractDirection<'margin-left'>




// Automatic sql_case to camelCase conversion

type ToCamelCase<S> = S extends `${infer Head}_${infer Tail}`
    ? `${Head}${ToCamelCase<Capitalize<Tail>>}` 
    : S


type Example = Uppercase<"keijo">

type FromSql<O extends object> = {
    [K in keyof O as ToCamelCase<K>]: O[K]
}

type ExampleObject = FromSql<{ user_id: 10, first_name: 'Peter' }>

interface SqlRowType {
    user_id: number,
    first_name_or_temp3: string
}

const fetchedRow: FromSql<SqlRowType> = {
    userId: 10,
    firstNameOrTemp3: 'Peter'
}


// We can now even split strings at compile time, so we can finally type
// JS APIs that were previously impossible to tackle!

// This combines template literal types with recursive conditional types!
type SplitBy<S, Splitter extends string> =
    S extends `${infer Head}${Splitter}${infer Tail}`
    ? [Head, ...SplitBy<Tail, Splitter>]
    : [S]

type ParsedLens = SplitBy<"user.profile.firstName", ".">



// Express route parsing

type GetRouteParams<S> =
    S extends `${string}/:${infer Name}/${infer Tail}`
    ? Record<Name, string> & GetRouteParams<Tail> :
        S extends `${string}/:${infer Name}`
        ? Record<Name, string> 
        : {}

type ExampleRoute = GetRouteParams<"/user/:user_id/posts/:post_id">

const params: ExampleRoute = {
    post_id: "10",
    user_id: "20"
}
