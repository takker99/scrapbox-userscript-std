# Migration Guide to v0.30.0

## Breaking Changes

### REST API Changes

The REST API has been completely redesigned to improve type safety, reduce dependencies, and better align with web standards. The main changes are:

1. Removal of `option-t` dependency
   - All `Result` types from `option-t/plain_result` have been replaced with `ScrapboxResponse`
   - No more `unwrapOk`, `isErr`, or other option-t utilities

2. New `ScrapboxResponse` class
   - Extends the web standard `Response` class
   - Direct access to `body`, `headers`, and other standard Response properties
   - Type-safe error handling based on HTTP status codes
   - Built-in JSON parsing with proper typing for success/error cases

### Before and After Examples

#### Before (v0.29.x):
```typescript
import { isErr, unwrapOk } from "option-t/plain_result";

const result = await getProfile();
if (isErr(result)) {
  console.error("Failed:", result);
  return;
}
const profile = unwrapOk(result);
console.log("Name:", profile.name);
```

#### After (v0.30.0):
```typescript
const response = await getProfile();
if (!response.ok) {
  console.error("Failed:", response.error);
  return;
}
console.log("Name:", response.data.name);
```

### Key Benefits

1. **Simpler Error Handling**
   - HTTP status codes determine error types
   - No need to unwrap results manually
   - Type-safe error objects with proper typing

2. **Web Standard Compatibility**
   - Works with standard web APIs without conversion
   - Direct access to Response properties
   - Compatible with standard fetch patterns

3. **Better Type Safety**
   - Response types change based on HTTP status
   - Proper typing for both success and error cases
   - No runtime overhead for type checking

### Migration Steps

1. Replace `option-t` imports:
   ```diff
   - import { isErr, unwrapOk } from "option-t/plain_result";
   ```

2. Update error checking:
   ```diff
   - if (isErr(result)) {
   -   console.error(result);
   + if (!response.ok) {
   +   console.error(response.error);
   ```

3. Access response data:
   ```diff
   - const data = unwrapOk(result);
   + const data = response.data;
   ```

4. For direct Response access:
   ```typescript
   // Access headers
   const contentType = response.headers.get("content-type");
   
   // Access raw body
   const text = await response.text();
   
   // Parse JSON with type safety
   const json = await response.json();
   ```

### Common Patterns

1. **Status-based Error Handling**:
```typescript
const response = await getSnapshot(project, pageId, timestampId);

if (response.status === 422) {
  // Handle invalid snapshot ID
  console.error("Invalid snapshot:", response.error);
  return;
}

if (!response.ok) {
  // Handle other errors
  console.error("Failed:", response.error);
  return;
}

// Use the data
console.log(response.data);
```

2. **Type-safe JSON Parsing**:
```typescript
const response = await getTweetInfo(tweetUrl);
if (response.ok) {
  const tweet = response.data;  // Properly typed as TweetInfo
  console.log(tweet.text);
}
```

3. **Working with Headers**:
```typescript
const response = await uploadToGCS(file, projectId);
if (!response.ok && response.headers.get("Content-Type")?.includes("/xml")) {
  console.error("GCS Error:", await response.text());
  return;
}
```

### Need Help?

If you encounter any issues during migration, please:
1. Check the examples in this guide
2. Review the [API documentation](https://jsr.io/@takker/scrapbox-userscript-std)
3. Open an issue on GitHub if you need further assistance
