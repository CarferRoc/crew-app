import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../theme';
import { MarketBid } from '../models/types';
import { getPartName } from '../lib/gameplay';

interface MyBidsSectionProps {
    myBids: MarketBid[];
    onEditBid: (bid: MarketBid) => void;
}

export const MyBidsSection = ({ myBids, onEditBid }: MyBidsSectionProps) => {
    const activeTheme = useAppTheme();

    if (myBids.length === 0) return null;

    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={{ color: activeTheme.colors.text, fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
                MIS PUJAS ACTIVAS ({myBids.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {myBids.map(bid => (
                    <View
                        key={`${bid.itemType}-${bid.itemId}`}
                        style={{
                            backgroundColor: activeTheme.colors.surface,
                            padding: 12,
                            borderRadius: 12,
                            marginRight: 10,
                            minWidth: 140,
                            borderWidth: 1,
                            borderColor: activeTheme.colors.primary + '40'
                        }}
                    >
                        <Text style={{ color: activeTheme.colors.text, fontSize: 10, fontWeight: 'bold' }}>
                            {bid.itemType === 'car'
                                ? `${bid.itemData.brand} ${bid.itemData.model}`
                                : getPartName(bid.itemData.type)}
                        </Text>
                        <Text style={{ color: activeTheme.colors.success, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
                            €{bid.amount.toLocaleString()}
                        </Text>
                        <TouchableOpacity onPress={() => onEditBid(bid)} style={{ marginTop: 8 }}>
                            <Text style={{ color: activeTheme.colors.primary, fontSize: 10, fontWeight: 'bold' }}>EDITAR PUJA</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};
