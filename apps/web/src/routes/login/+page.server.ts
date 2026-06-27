import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { isCorrectPassword, setAuthCookie } from '$lib/server/auth';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const form     = await request.formData();
    const password = String(form.get('password') ?? '');
    if (!password || !isCorrectPassword(password)) return fail(401, { error: 'Passphrase salah.' });
    setAuthCookie(cookies);
    redirect(303, '/');
  },
};
