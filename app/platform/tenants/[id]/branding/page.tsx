'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    custom_logo_url?: string;
    custom_primary_color?: string;
    custom_secondary_color?: string;
    custom_fonts?: {
        heading?: string;
        body?: string;
    };
}

export default function TenantBrandingEditor({ params }: { params: Promise<{ id: string }> }) {
    // Next.js 15: params is now a Promise, must use React.use()
    const resolvedParams = use(params);
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [logoUrl, setLogoUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#B24700');
    const [secondaryColor, setSecondaryColor] = useState('#D65D0E');
    const [headingFont, setHeadingFont] = useState('Inter');
    const [bodyFont, setBodyFont] = useState('Inter');

    useEffect(() => {
        loadTenant();
    }, []);

    async function loadTenant() {
        try {
            setLoading(true);
            // Get tenant info from main API
            const res = await fetch('/api/platform/tenants');

            if (!res.ok) {
                throw new Error('Failed to load tenants');
            }

            const data = await res.json();
            const foundTenant = data.tenants.find((t: Tenant) => t.id === resolvedParams.id);

            if (!foundTenant) {
                throw new Error('Tenant not found');
            }

            setTenant(foundTenant);

            // Set form values
            setLogoUrl(foundTenant.custom_logo_url || '');
            setPrimaryColor(foundTenant.custom_primary_color || '#B24700');
            setSecondaryColor(foundTenant.custom_secondary_color || '#D65D0E');
            setHeadingFont(foundTenant.custom_fonts?.heading || 'Inter');
            setBodyFont(foundTenant.custom_fonts?.body || 'Inter');

        } catch (err: any) {
            console.error('Error loading tenant:', err);
            alert('Failed to load tenant: ' + err.message);
            router.push('/platform');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!tenant) return;

        try {
            setSaving(true);

            const res = await fetch(`/api/platform/tenants/${tenant.id}/branding`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    custom_logo_url: logoUrl,
                    custom_primary_color: primaryColor,
                    custom_secondary_color: secondaryColor,
                    custom_fonts: {
                        heading: headingFont,
                        body: bodyFont
                    }
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update branding');
            }

            alert('✅ Branding updated successfully!');
            router.push('/platform');

        } catch (err: any) {
            console.error('Error saving branding:', err);
            alert('❌ Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <button
                                onClick={() => router.push('/platform')}
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
                            >
                                <Icon name="arrow_back" className="text-xl" />
                                <span className="text-sm">Về Platform Dashboard</span>
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Icon name="palette" className="text-4xl text-primary-600" />
                                Tùy chỉnh Branding
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                {tenant?.name} (@{tenant?.slug})
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Editor Panel */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Logo</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Logo URL
                                </label>
                                <input
                                    type="url"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    Upload logo lên CDN và paste URL vào đây
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Màu sắc</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={secondaryColor}
                                            onChange={(e) => setSecondaryColor(e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Fonts</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Heading Font
                                    </label>
                                    <select
                                        value={headingFont}
                                        onChange={(e) => setHeadingFont(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="Inter">Inter</option>
                                        <option value="Poppins">Poppins</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Outfit">Outfit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Body Font
                                    </label>
                                    <select
                                        value={bodyFont}
                                        onChange={(e) => setBodyFont(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="Inter">Inter</option>
                                        <option value="Poppins">Poppins</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Outfit">Outfit</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="save" className="text-xl" />
                                        <span>Lưu thay đổi</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => router.push('/platform')}
                                className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Preview</h2>

                            <div className="space-y-4">
                                {/* Logo Preview */}
                                {logoUrl && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo</p>
                                        <img
                                            src={logoUrl}
                                            alt="Logo preview"
                                            className="h-16 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="40"%3E%3Ctext x="10" y="25" fill="%23999"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Colors Preview */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Colors</p>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <div
                                                className="h-20 rounded-lg shadow-sm mb-2"
                                                style={{ backgroundColor: primaryColor }}
                                            ></div>
                                            <p className="text-xs text-center text-gray-600 dark:text-gray-400">Primary</p>
                                        </div>
                                        <div className="flex-1">
                                            <div
                                                className="h-20 rounded-lg shadow-sm mb-2"
                                                style={{ backgroundColor: secondaryColor }}
                                            ></div>
                                            <p className="text-xs text-center text-gray-600 dark:text-gray-400">Secondary</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Button Preview */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Button Styles</p>
                                    <div className="space-y-2">
                                        <button
                                            className="w-full py-2 px-4 rounded-lg text-white font-semibold"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Primary Button
                                        </button>
                                        <button
                                            className="w-full py-2 px-4 rounded-lg text-white font-semibold"
                                            style={{ backgroundColor: secondaryColor }}
                                        >
                                            Secondary Button
                                        </button>
                                    </div>
                                </div>

                                {/* Typography Preview */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Typography</p>
                                    <h3
                                        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                                        style={{ fontFamily: headingFont }}
                                    >
                                        Heading Font
                                    </h3>
                                    <p
                                        className="text-base text-gray-600 dark:text-gray-400"
                                        style={{ fontFamily: bodyFont }}
                                    >
                                        Body text appears in this font. This is how regular paragraph text will look throughout the application.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
