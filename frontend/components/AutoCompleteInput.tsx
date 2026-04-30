import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type SuggestionItem = {
  name: string;
  contains?: string;
};

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (text: string) => void;
  data: SuggestionItem[];
  subText?: (item: SuggestionItem) => string;
};

export default function AutoCompleteInput({
  label,
  placeholder,
  value,
  onChangeValue,
  data,
  subText,
}: Props) {
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (query.length < 2) return [];

    const starts: SuggestionItem[] = [];
    const includes: SuggestionItem[] = [];

    for (const item of data) {
      const name = String(item.name || "").toLowerCase();
      const contains = String(item.contains || "").toLowerCase();

      if (name.startsWith(query)) {
        starts.push(item);
      } else if (name.includes(query) || contains.includes(query)) {
        includes.push(item);
      }

      if (starts.length >= 5) break;
    }

    const merged = [...starts];

    if (merged.length < 5) {
      for (const item of includes) {
        if (!merged.some((x) => x.name === item.name)) {
          merged.push(item);
        }
        if (merged.length >= 5) break;
      }
    }

    return merged;
  }, [value, data]);

  const showDropdown = focused && results.length > 0;

  const selectItem = (item: SuggestionItem) => {
    onChangeValue(item.name);
    setFocused(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeValue}
        placeholder={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
      />

      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => selectItem(item)}
              >
                <Text style={styles.itemTitle}>{item.name}</Text>
                {!!subText && (
                  <Text style={styles.itemSub}>{subText(item)}</Text>
                )}
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#344E41",
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#F1F5F2",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: "#111",
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 14,
    maxHeight: 220,
    overflow: "hidden",
    elevation: 5,
  },
  item: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2EF",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1B4332",
  },
  itemSub: {
    fontSize: 12,
    color: "#66736B",
    marginTop: 3,
  },
});