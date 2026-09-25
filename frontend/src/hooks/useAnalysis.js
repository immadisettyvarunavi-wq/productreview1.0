/**
 * useAnalysis hook — manages the full analysis pipeline state.
 */

import { useState, useCallback } from 'react';
import { analyzeImage, analyzeProductQuery } from '../utils/api';

const PIPELINE_STEPS = [
  { id: 'upload', label: 'Processing product data...' },
  { id: 'search', label: 'Searching live product catalog...' },
  { id: 'match', label: 'Verifying seller listings...' },
  { id: 'details', label: 'Fetching pricing and specs...' },
  { id: 'reviews', label: 'Collecting authentic customer reviews...' },
  { id: 'analysis', label: 'Analyzing reviews with AI (anti-hallucination)...' },
  { id: 'report', label: 'Building dynamic intelligence report...' },
];

export function useAnalysis() {
  const [state, setState] = useState({
    status: 'idle', // idle | processing | success | ambiguous | error | not_found
    currentStep: 0,
    steps: PIPELINE_STEPS,
    data: null,
    error: null,
    file: null,
    preview: null,
    activeQuery: null,
  });

  const startAnalysis = useCallback(async (file) => {
    // Create preview
    const preview = URL.createObjectURL(file);
    const fileNameClean = file.name ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Uploaded Product';

    setState(s => ({
      ...s,
      status: 'processing',
      currentStep: 0,
      file,
      preview,
      activeQuery: fileNameClean,
      error: null,
      data: null,
    }));

    // Simulate pipeline progress
    const stepInterval = setInterval(() => {
      setState(s => {
        if (s.currentStep < PIPELINE_STEPS.length - 1) {
          return { ...s, currentStep: s.currentStep + 1 };
        }
        return s;
      });
    }, 2000);

    try {
      const result = await analyzeImage(file);

      clearInterval(stepInterval);

      if (result.status === 'success') {
        setState(s => ({
          ...s,
          status: 'success',
          currentStep: PIPELINE_STEPS.length,
          data: result,
        }));
      } else if (result.status === 'ambiguous') {
        setState(s => ({
          ...s,
          status: 'ambiguous',
          currentStep: PIPELINE_STEPS.length,
          data: result,
        }));
      } else if (result.status === 'not_found') {
        setState(s => ({
          ...s,
          status: 'not_found',
          currentStep: PIPELINE_STEPS.length,
          data: result,
          error: result.message,
        }));
      } else {
        setState(s => ({
          ...s,
          status: 'success',
          currentStep: PIPELINE_STEPS.length,
          data: result,
        }));
      }
    } catch (err) {
      clearInterval(stepInterval);
      setState(s => ({
        ...s,
        status: 'error',
        error: err.message || 'Analysis failed. Please try again.',
      }));
    }
  }, []);

  const analyzeQuery = useCallback(async (queryText = 'Colgate MaxFresh Spicy Fresh Red Gel Toothpaste') => {
    setState(s => ({
      ...s,
      status: 'processing',
      currentStep: 1,
      preview: null,
      activeQuery: queryText,
      error: null,
      data: null,
    }));

    const stepInterval = setInterval(() => {
      setState(s => {
        if (s.currentStep < PIPELINE_STEPS.length - 1) {
          return { ...s, currentStep: s.currentStep + 1 };
        }
        return s;
      });
    }, 1500);

    try {
      const result = await analyzeProductQuery(queryText);
      clearInterval(stepInterval);
      setState(s => ({
        ...s,
        status: 'success',
        currentStep: PIPELINE_STEPS.length,
        data: result,
      }));
    } catch (err) {
      clearInterval(stepInterval);
      setState(s => ({
        ...s,
        status: 'error',
        error: err.message || 'Analysis failed. Please try again.',
      }));
    }
  }, []);

  const selectCandidate = useCallback((candidate) => {
    const title = candidate.title || candidate.name;
    if (title) {
      analyzeQuery(title);
    }
  }, [analyzeQuery]);

  const reset = useCallback(() => {
    if (state.preview) URL.revokeObjectURL(state.preview);
    setState({
      status: 'idle',
      currentStep: 0,
      steps: PIPELINE_STEPS,
      data: null,
      error: null,
      file: null,
      preview: null,
      activeQuery: null,
    });
  }, [state.preview]);

  const showDemoReport = useCallback(() => {
    analyzeQuery('Colgate MaxFresh Spicy Fresh Red Gel Toothpaste');
  }, [analyzeQuery]);

  return { ...state, startAnalysis, analyzeQuery, reset, selectCandidate, showDemoReport };
}
