'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CompanyInfo {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_website: string;
    employee_count: string;
    contact_name: string;
    contact_title: string;
    contact_email: string;
    contact_phone: string;
    signup_source: string;
}

interface CompanyInfoFormProps {
    onNext: (data: CompanyInfo) => void;
    initialData?: Partial<CompanyInfo>;
}

export default function CompanyInfoForm({ onNext, initialData }: CompanyInfoFormProps) {
    const [formData, setFormData] = useState<CompanyInfo>({
        company_name: initialData?.company_name || '',
        company_address: initialData?.company_address || '',
        company_phone: initialData?.company_phone || '',
        company_website: initialData?.company_website || '',
        employee_count: initialData?.employee_count || '1-10',
        contact_name: initialData?.contact_name || '',
        contact_title: initialData?.contact_title || '',
        contact_email: initialData?.contact_email || '',
        contact_phone: initialData?.contact_phone || '',
        signup_source: initialData?.signup_source || 'website',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CompanyInfo, string>>>({});

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CompanyInfo, string>> = {};

        // Required fields
        if (!formData.company_name.trim()) {
            newErrors.company_name = 'Tên công ty là bắt buộc';
        }
        if (!formData.contact_name.trim()) {
            newErrors.contact_name = 'Tên người liên hệ là bắt buộc';
        }
        if (!formData.contact_email.trim()) {
            newErrors.contact_email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = 'Email không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onNext(formData);
        }
    };

    const handleChange = (field: keyof CompanyInfo, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Thông tin công ty</h2>
                <p className="text-sm text-gray-600">
                    Vui lòng cung cấp thông tin về công ty của bạn để chúng tôi có thể hỗ trợ tốt hơn
                </p>
            </div>

            {/* Company Information Section */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-700">Thông tin công ty</h3>

                <div className="space-y-2">
                    <Label htmlFor="company_name">
                        Tên công ty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="company_name"
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        placeholder="Ví dụ: Công ty ABC"
                        className={errors.company_name ? 'border-red-500' : ''}
                    />
                    {errors.company_name && (
                        <p className="text-sm text-red-500">{errors.company_name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company_address">Địa chỉ công ty</Label>
                    <Input
                        id="company_address"
                        type="text"
                        value={formData.company_address}
                        onChange={(e) => handleChange('company_address', e.target.value)}
                        placeholder="Ví dụ: 123 Đường ABC, Quận 1, TP.HCM"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company_phone">Số điện thoại</Label>
                        <Input
                            id="company_phone"
                            type="tel"
                            value={formData.company_phone}
                            onChange={(e) => handleChange('company_phone', e.target.value)}
                            placeholder="Ví dụ: 0123456789"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company_website">Website</Label>
                        <Input
                            id="company_website"
                            type="url"
                            value={formData.company_website}
                            onChange={(e) => handleChange('company_website', e.target.value)}
                            placeholder="Ví dụ: https://example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="employee_count">Số lượng nhân viên</Label>
                    <select
                        id="employee_count"
                        value={formData.employee_count}
                        onChange={(e) => handleChange('employee_count', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="1-10">1-10 nhân viên</option>
                        <option value="11-50">11-50 nhân viên</option>
                        <option value="51-200">51-200 nhận viên</option>
                        <option value="200+">Trên 200 nhân viên</option>
                    </select>
                </div>
            </div>

            {/* Contact Person Section */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-700">Thông tin người liên hệ</h3>

                <div className="space-y-2">
                    <Label htmlFor="contact_name">
                        Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="contact_name"
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => handleChange('contact_name', e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className={errors.contact_name ? 'border-red-500' : ''}
                    />
                    {errors.contact_name && (
                        <p className="text-sm text-red-500">{errors.contact_name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contact_title">Chức vụ</Label>
                    <Input
                        id="contact_title"
                        type="text"
                        value={formData.contact_title}
                        onChange={(e) => handleChange('contact_title', e.target.value)}
                        placeholder="Ví dụ: Giám đốc Nhân sự"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="contact_email">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => handleChange('contact_email', e.target.value)}
                            placeholder="example@company.com"
                            className={errors.contact_email ? 'border-red-500' : ''}
                        />
                        {errors.contact_email && (
                            <p className="text-sm text-red-500">{errors.contact_email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_phone">Số điện thoại</Label>
                        <Input
                            id="contact_phone"
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => handleChange('contact_phone', e.target.value)}
                            placeholder="0123456789"
                        />
                    </div>
                </div>
            </div>

            {/* Signup Source */}
            <div className="space-y-2">
                <Label htmlFor="signup_source">Bạn biết đến Cơm Ngon qua kênh nào?</Label>
                <select
                    id="signup_source"
                    value={formData.signup_source}
                    onChange={(e) => handleChange('signup_source', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                    <option value="website">Website / Tìm kiếm Google</option>
                    <option value="referral">Giới thiệu từ bạn bè/đối tác</option>
                    <option value="sales">Sales liên hệ</option>
                    <option value="social">Mạng xã hội (Facebook, LinkedIn...)</option>
                    <option value="other">Khác</option>
                </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8"
                >
                    Tiếp tục
                </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
                Thông tin của bạn sẽ được bảo mật và chỉ dùng để liên hệ hỗ trợ
            </p>
        </form>
    );
}
