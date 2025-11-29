import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { NotificationService, NotificationSettings } from '../services/notificationService';

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const loaded = await NotificationService.loadSettings();
        setSettings(loaded);
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        // Request permissions if enabling any notifications
        if (settings.hydration.enabled || settings.meals.enabled) {
            const granted = await NotificationService.registerForPushNotificationsAsync();
            if (!granted) {
                Alert.alert('Permission Required', 'Please enable notifications in your system settings to use this feature.');
                setIsSaving(false);
                return;
            }
        }

        await NotificationService.saveSettings(settings);
        setIsSaving(false);
        Alert.alert('Success', 'Settings saved and notifications scheduled!');
    };

    const updateHydration = (key: keyof NotificationSettings['hydration'], value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            hydration: { ...settings.hydration, [key]: value }
        });
    };

    const updateMeals = (key: keyof NotificationSettings['meals'], value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            meals: { ...settings.meals, [key]: value }
        });
    };

    const updateQuietHours = (key: keyof NotificationSettings['quietHours'], value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            quietHours: { ...settings.quietHours, [key]: value }
        });
    };

    if (!settings) return <View style={styles.loading}><Text>Loading...</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.content}>

                {/* Hydration Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>💧 Hydration Reminders</Text>
                        <Switch
                            value={settings.hydration.enabled}
                            onValueChange={(v) => updateHydration('enabled', v)}
                            trackColor={{ false: '#767577', true: '#3B82F6' }}
                        />
                    </View>

                    {settings.hydration.enabled && (
                        <View style={styles.controls}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Frequency (minutes)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.hydration.frequencyMinutes.toString()}
                                    onChangeText={(t) => updateHydration('frequencyMinutes', parseInt(t) || 60)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Start Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.hydration.startTime}
                                    onChangeText={(t) => updateHydration('startTime', t)}
                                    placeholder="08:00"
                                />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>End Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.hydration.endTime}
                                    onChangeText={(t) => updateHydration('endTime', t)}
                                    placeholder="20:00"
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Meals Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🥗 Meal Reminders</Text>
                        <Switch
                            value={settings.meals.enabled}
                            onValueChange={(v) => updateMeals('enabled', v)}
                            trackColor={{ false: '#767577', true: '#10B981' }}
                        />
                    </View>

                    {settings.meals.enabled && (
                        <View style={styles.controls}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Frequency (hours)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.meals.frequencyHours.toString()}
                                    onChangeText={(t) => updateMeals('frequencyHours', parseInt(t) || 4)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Start Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.meals.startTime}
                                    onChangeText={(t) => updateMeals('startTime', t)}
                                    placeholder="08:00"
                                />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>End Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.meals.endTime}
                                    onChangeText={(t) => updateMeals('endTime', t)}
                                    placeholder="20:00"
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Quiet Hours Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>🌙 Quiet Hours</Text>
                        <Switch
                            value={settings.quietHours.enabled}
                            onValueChange={(v) => updateQuietHours('enabled', v)}
                            trackColor={{ false: '#767577', true: '#8B5CF6' }}
                        />
                    </View>

                    {settings.quietHours.enabled && (
                        <View style={styles.controls}>
                            <Text style={styles.hint}>Notifications will be suppressed during this time.</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Start Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.quietHours.startTime}
                                    onChangeText={(t) => updateQuietHours('startTime', t)}
                                    placeholder="22:00"
                                />
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>End Time (HH:mm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={settings.quietHours.endTime}
                                    onChangeText={(t) => updateQuietHours('endTime', t)}
                                    placeholder="07:00"
                                />
                            </View>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    controls: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    row: {
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#1F2937',
    },
    hint: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
