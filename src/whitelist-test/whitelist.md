## Common Errors

### Flow errors

Please take note that for roles v1 you cannot scope parameters until you have first scoped a function.
 
Scope Target -> Scope Function -> Scope Parameters is the correct flow.
 
If you try Scope Target -> Scope Parameters directly all calls from the manager will fail with FunctionNotAllowed() error

### scopeParamterAsOneOf errors

You need at least 2 parameters to scope as oneOf. 1 will fail with NoteEnoughCompValuesForOneOf(). You can use scopeParamter in the case of 1 parameter.

