import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, Lock, Phone } from "lucide-react-native";
import { supabase } from "@/src/lib/supabase/client";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [usePhone, setUsePhone] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });
            if (error) throw error;
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async () => {
        if (!phone) {
            Alert.alert("Error", "Please enter phone number");
            return;
        }
        setLoading(true);
        try {
            const formattedPhone = phone.startsWith("+")
                ? phone
                : `+91${phone}`;
            const { error } = await supabase.auth.signInWithOtp({
                phone: formattedPhone.trim(),
            });
            if (error) throw error;
            router.push({
                pathname: "/(auth)/otp" as any,
                params: { phone: formattedPhone.trim() },
            });
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerBlock}>
                        <Text style={styles.title}>Welcome to Tifinnity</Text>
                        <Text style={styles.subtitle}>
                            Ghar jaisa swad, ab aapke paas
                        </Text>
                    </View>

                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.toggleBtn,
                                !usePhone && styles.toggleBtnActive,
                            ]}
                            onPress={() => setUsePhone(false)}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    !usePhone && styles.toggleTextActive,
                                ]}
                            >
                                Email Login
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleBtn,
                                usePhone && styles.toggleBtnActive,
                            ]}
                            onPress={() => setUsePhone(true)}
                        >
                            <Text
                                style={[
                                    styles.toggleText,
                                    usePhone && styles.toggleTextActive,
                                ]}
                            >
                                OTP Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {usePhone ? (
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Phone
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 10-digit Phone Number"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                    autoCapitalize="none"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handlePhoneLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>
                                        Send OTP
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Mail
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Lock
                                    size={20}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    autoCapitalize="none"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleEmailLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>
                                        Login
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>
                            {"Don't have an account? "}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/signup" as any)}
                        >
                            <Text style={styles.linkText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F9FA" },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    headerBlock: { alignItems: "center", marginBottom: 36 },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#065F46",
        marginBottom: 8,
    },
    subtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
    toggleRow: {
        flexDirection: "row",
        backgroundColor: "#E5E7EB",
        borderRadius: 25,
        padding: 4,
        marginBottom: 28,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 21,
    },
    toggleBtnActive: { backgroundColor: "#059669" },
    toggleText: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
    toggleTextActive: { color: "#FFFFFF" },
    form: { width: "100%", marginBottom: 24 },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
        height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: "#374151" },
    submitBtn: {
        backgroundColor: "#065F46",
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#065F46",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    footerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
    },
    footerText: { fontSize: 13, color: "#6B7280" },
    linkText: { fontSize: 13, fontWeight: "700", color: "#059669" },
});
