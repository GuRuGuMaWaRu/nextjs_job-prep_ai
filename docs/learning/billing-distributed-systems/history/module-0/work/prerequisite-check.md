1. What happens between entering a URL and receiving an HTTP response? 2/5
   A request goes to a server (first going through DNS or something to get the address right) and that server sends back a response

2. Where do variables in a running Node.js program live, and what happens to them when the process stops? 4/5
   They live in memory and they are deleted (garbage collected I suppose) when the process stops.

3. What does it mean for a database write to commit? 1/5
   That the data is written to a corresponding table and there is a record with the updated data now.

4. If JavaScript runs callbacks on an event loop, can two requests still interfere with one another? Why or why not? 2/5
   I doubt that they can interfere - at least not as far as client-side code is concerned. Yet if we are talking about requests that reach outside then I believe it is very much possible. Like one request taking longer than the other and so an item can be first deleted and only then an update attempt on that item can be made.

5. If an external API call times out, which outcomes remain possible? 2/5
   I don't know, to me it seems that if an external API call has timed out there be an unfavourable response and no further attempts will be made, unless there is an additional mechanism for repeating timed-out calls.

6. If the same webhook arrives twice, what could be duplicated? 3/5
   If it's about subscriptions then cancellations, creations, updates, payment confirmations - don't really see how that could be a problem. Unless we first get creation, then deletion, and then a duplicate of creation comes again.

7. If two status updates arrive in reverse order, which one should local state represent? 4/5
   The most recent one - I think this the case where we should always call the outside service to confirm the actual current state.

Confidence ratings were recorded retrospectively after the Level 0 review.
Highest assistance used: Level 2  
Level 2 topic: garbage collection versus operating-system memory reclamation
