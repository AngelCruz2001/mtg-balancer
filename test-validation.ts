import { parseAnalysisResponse } from './src/lib/analysis';

function test() {
  console.log('Testing parseAnalysisResponse...');

  // 1. Valid response
  try {
    const validResponse = 'Some text before {"scores": [{"seat": 1, "name": "P1", "score": 80, "summary": "Good"}], "explanation": "Logic"} some text after';
    const result = parseAnalysisResponse(validResponse);
    console.log('✅ Valid response passed');
  } catch (e) {
    console.error('❌ Valid response failed:', e);
  }

  // 2. Not JSON
  try {
    parseAnalysisResponse('no json here');
    console.error('❌ No JSON test failed: should have thrown');
  } catch (e: any) {
    if (e.message === 'No JSON object found in analysis response') {
      console.log('✅ No JSON test passed');
    } else {
      console.error('❌ No JSON test failed with wrong message:', e.message);
    }
  }

  // 3. Invalid JSON
  try {
    parseAnalysisResponse('{ invalid json');
    console.error('❌ Invalid JSON test failed: should have thrown');
  } catch (e: any) {
    if (e.message === 'Analysis response contained invalid JSON') {
      console.log('✅ Invalid JSON test passed');
    } else {
      console.error('❌ Invalid JSON test failed with wrong message:', e.message);
    }
  }

  // 4. Missing scores
  try {
    parseAnalysisResponse('{"explanation": "Missing scores"}');
    console.error('❌ Missing scores test failed: should have thrown');
  } catch (e: any) {
    if (e.message === 'Analysis response missing required "scores" array or "explanation" string') {
      console.log('✅ Missing scores test passed');
    } else {
      console.error('❌ Missing scores test failed with wrong message:', e.message);
    }
  }

  // 5. Malformed score entry
  try {
    parseAnalysisResponse('{"scores": [{"seat": "1", "name": "P1", "score": 80, "summary": "Good"}], "explanation": "Logic"}');
    console.error('❌ Malformed score entry test failed: should have thrown');
  } catch (e: any) {
    if (e.message === 'Analysis response contains a malformed score entry') {
      console.log('✅ Malformed score entry test passed');
    } else {
      console.error('❌ Malformed score entry test failed with wrong message:', e.message);
    }
  }
}

test();
