import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { theme, useAppTheme } from '../theme';
import { Header } from '../components/Header';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { User } from '../models/types';

export const AdminPanelScreen = ({ navigation }: any) => {
    const activeTheme = useAppTheme();
    const { currentUser, updateUserRole } = useStore();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [roleModalVisible, setRoleModalVisible] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        // En un entorno real, traeríamos esto de Supabase
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true });

        if (error) {
            Alert.alert('Error', 'No se pudieron cargar los usuarios');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const filteredUsers = users.filter(u =>
        (u.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const handleRoleUpdate = async (newRole: 'user' | 'lider' | 'admin') => {
        if (!selectedUser) return;

        try {
            await updateUserRole(selectedUser.id, newRole);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
            setRoleModalVisible(false);
            Alert.alert('Éxito', `Rol de ${selectedUser.username} actualizado a ${newRole}`);
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el rol');
        }
    };

    const renderUserItem = ({ item }: { item: any }) => (
        <View style={[styles.userCard, { backgroundColor: activeTheme.colors.surface, borderColor: activeTheme.colors.border }]}>
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: activeTheme.colors.text }]}>{item.username || 'Sin nick'}</Text>
                <Text style={[styles.userRole, { color: activeTheme.colors.textMuted }]}>{item.role.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: activeTheme.colors.primary }]}
                onPress={() => {
                    setSelectedUser(item);
                    setRoleModalVisible(true);
                }}
            >
                <Text style={styles.actionBtnText}>Cambiar Rol</Text>
            </TouchableOpacity>
        </View>
    );

    if (currentUser?.role !== 'admin') {
        return (
            <View style={[styles.container, { backgroundColor: activeTheme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: activeTheme.colors.error, fontSize: 18 }}>Acceso Denegado</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background }]}>
            <Header title="Panel Admin" />

            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: activeTheme.colors.surface, color: activeTheme.colors.text, borderColor: activeTheme.colors.border }]}
                    placeholder="Buscar usuario..."
                    placeholderTextColor={activeTheme.colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={activeTheme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: activeTheme.colors.textMuted }]}>No se encontraron usuarios.</Text>
                    }
                />
            )}

            <Modal
                transparent
                visible={roleModalVisible}
                animationType="fade"
                onRequestClose={() => setRoleModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeTheme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: activeTheme.colors.text }]}>Cambiar Rol de {selectedUser?.username}</Text>

                        {(['user', 'lider', 'admin'] as const).map((role) => (
                            <TouchableOpacity
                                key={role}
                                style={[styles.roleOption, selectedUser?.role === role && { backgroundColor: activeTheme.colors.primary + '20' }]}
                                onPress={() => handleRoleUpdate(role)}
                            >
                                <Text style={[styles.roleOptionText, { color: selectedUser?.role === role ? activeTheme.colors.primary : activeTheme.colors.text }]}>
                                    {role.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setRoleModalVisible(false)}
                        >
                            <Text style={[styles.closeBtnText, { color: activeTheme.colors.textMuted }]}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: { padding: theme.spacing.m },
    searchInput: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        borderWidth: 1,
    },
    list: { padding: theme.spacing.m },
    userCard: {
        padding: theme.spacing.m,
        borderRadius: theme.roundness.m,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
        borderWidth: 1,
    },
    userInfo: { flex: 1 },
    userName: { fontWeight: 'bold', fontSize: 16 },
    userRole: { fontSize: 12, marginTop: 2 },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    emptyText: { textAlign: 'center', marginTop: 40 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    roleOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        alignItems: 'center',
    },
    roleOptionText: { fontWeight: 'bold' },
    closeBtn: { marginTop: 16, alignItems: 'center' },
    closeBtnText: { fontWeight: '600' },
});
