4. Expected logout behavior
Scenario	Session count	Refresh token count	Result
Normal logout	1	                 1	           true
Multiple refresh tokens	1	3	true
Already logged out	0	0	false
Session exists, tokens already revoked	1	0	true
Session doesn't exist	0	0	false

