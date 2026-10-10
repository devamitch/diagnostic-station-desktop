'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseMutationOptions, UseMutationResult, UseQueryOptions } from '@tanstack/react-query';
import type { DeepPartial } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ZodType } from 'zod'; 

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApiClient<T>(url: string, options?: any) {
	return useQuery({
		queryKey: useMemo(() => [url], [url]),
		queryFn: useCallback(async () => {
			const { data } = await api.get<T>(url);
			return data;
		}, [url]),
		staleTime: 60000,
		retry: 2,
		...options,
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApiMutationClient<TResponse, TVariables>(url: string, options?: any) {
	return useMutation({
		mutationFn: useCallback(
			async (variables: TVariables) => {
				const { data } = await api.post<TResponse, TVariables>(url, variables);
				return data;
			},
			[url]
		),
		onSuccess: () => {
			toast.success('Operation completed successfully');
		},
		onError: (error) => {
			if (error instanceof AxiosError) {
				toast.error(error.response?.data?.message || 'API request failed');
			} else {
				toast.error('An unexpected error occurred');
			}
		},
		...options,
	});
}

export type AsyncDefaultValues<TFieldValues> = (payload?: unknown) => Promise<TFieldValues>;

export type DefaultValues<TFieldValues> =
	TFieldValues extends AsyncDefaultValues<TFieldValues>
		? DeepPartial<Awaited<TFieldValues>>
		: DeepPartial<TFieldValues>;

export function useApi<T>(
	url: string,
	options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>
) {
	return useQuery<T, AxiosError>({
		queryKey: useMemo(() => [url], [url]),
		queryFn: useCallback(async () => {
			const { data } = await api.get<T>(url);
			return data;
		}, [url]),
		staleTime: 60000,
		// cacheTime: 300000,
		retry: 2,
		...options,
	});
}

export function useApiMutation<TResponse, TVariables>(
	url: string,
	options?: Omit<UseMutationOptions<TResponse, AxiosError, TVariables>, 'mutationFn'>
): UseMutationResult<TResponse, AxiosError, TVariables> {
	return useMutation<TResponse, AxiosError, TVariables>({
		mutationFn: useCallback(
			async (variables: TVariables) => {
				const { data } = await api.post<TResponse, TVariables>(url, variables);
				return data;
			},
			[url]
		),
		...options,
	});
}

export function useFormMutation<
  TFormData extends Record<string, unknown>,
  TMutationData
>(
  schema: ZodSchema<TFormData>,
  mutationFn: (data: TFormData) => Promise<TMutationData>,
  options?: Omit<
    UseMutationOptions<TMutationData, Error, TFormData>,
    "mutationFn"
  > & {
    defaultValues?: DefaultValues<TFormData> | AsyncDefaultValues<TFormData>;
    transform?: (data: TFormData) => Partial<TFormData>;
    mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | undefined;
    reValidateMode?: "onChange" | "onBlur" | "onSubmit" | undefined;
  }
) {
  const form = useForm<TFormData>({
    resolver: zodResolver(schema),
    mode: options?.mode ?? "onTouched",
    reValidateMode: options?.reValidateMode ?? "onChange",
    defaultValues: options?.defaultValues,
  });

  const mutation = useMutation<TMutationData, Error, TFormData>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      toast.success("Operation completed successfully");
      options?.onSuccess?.(data, variables, context);
    },

    onError: (error: any, variables, context) => {
      let errorMessage = "An unexpected error occurred";

      if (error instanceof z.ZodError) {
        errorMessage = error.errors[0]?.message || "Validation failed";
      } else if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || "API request failed";
      } else if (error?.message?.message) {
        // Handle nested message structure: { message: { message: string, ... } }
        errorMessage = error.message.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Ensure errorMessage is always a string
      if (typeof errorMessage !== "string") {
        errorMessage = "An unexpected error occurred";
      }

      toast.error(errorMessage);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });

  const onSubmit = useCallback(
    form.handleSubmit((data) => {
      const transformedData = options?.transform
        ? options.transform(data)
        : data;
      mutation.mutate(transformedData as TFormData);
    }),
    [options?.transform, mutation]
  );

  return {
    form,
    mutation,
    ...form,
    ...mutation,
    onSubmit,
    isSubmitting: mutation?.isPending,
    errors: form?.formState?.errors,
  };
}
