import streamlit as st
import time

# --- LOGO & BRANDING ---
st.set_page_config(page_title="IPDC CRM Assistant", page_icon="🏦", layout="wide")

# Custom CSS for IPDC Colors (Blue/Yellow/Red vibe)
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stButton>button {
        background-color: #e63946;
        color: white;
        border-radius: 5px;
    }
    .stSidebar {
        background-color: #1d3557;
        color: white;
    }
    </style>
    """, unsafe_allow_html=True)

# --- SIDEBAR (Settings & Manuals) ---
with st.sidebar:
    st.title("🏦 IPDC CRM Control")
    st.subheader("Digital Knowledge Base")
    
    # Enable multiple file uploads
    uploaded_files = st.file_uploader(
        "Upload IPDC Policy Manuals (PDF)", 
        type="pdf", 
        accept_multiple_files=True
    )
    
    if uploaded_files:
        st.success(f"{len(uploaded_files)} Manuals Active")
        with st.expander("📚 Loaded Documents"):
            for idx, file in enumerate(uploaded_files):
                st.write(f"{idx+1}. {file.name}")
    
    st.divider()
    active_search = st.toggle("Enable Live Web Search (Bangladesh Bank)")
    if active_search:
        st.caption("🌐 Searching live circulars & market data...")
        st.link_button("🔗 Open BB Circulars Page", "https://www.bb.org.bd/en/index.php/publication/publictn/5/circular")
        
    st.divider()
    with st.expander("📜 Policy Timeline Explorer"):
        year = st.select_slider("Select Target Year", options=["2022", "2023", "2024", "2025", "2026"])
        st.caption(f"Showing major policy shifts for {year}...")
        if year == "2022": st.info("📉 Rule: Interest rate capped at 9/6%.")
        elif year == "2024": st.info("📈 Rule: Shift to 'SMART' rate system.")
        else: st.info("🚀 Rule: Dynamic market rates + 3.5% margin.")
    
    st.divider()
    st.info("Role: Multi-Product CRM Assistant")
    st.warning("Note: This is a prototype for Thesis research.")

# --- MAIN INTERFACE ---
st.title("IPDC Intelligent Credit Policy Assistant")
st.markdown("---")

# Initialize Chat History
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display Chat History
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# User Input
if prompt := st.chat_input("Ask a credit policy question..."):
    # Clear previous answer and show the new message
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # --- AI BRAIN (The "Logic" Section) ---
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""
# --- MAIN INTERFACE (TABS) ---
tab1, tab2 = st.tabs(["💬 Assistant", "💰 Eligibility Calculator"])

with tab1:
    st.caption("AI-powered analysis for Home, Auto, and SME lending.")
    
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat Input logic
    if prompt := st.chat_input("Ask a credit policy question...", key="main_crm_chat"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""
            
            # --- NEW: Internal Logic & Knowledge Search ---
            mock_answers = {
                "sme": "✅ **SME Policy (2024):** Max loan for Mfg. is 50M BDT. Equity ratio must be 70:30. Required: 3 years trade incense.",
                "retail": "✅ **Home Loan:** Max tenure 25 years. Interest rate is SMART+3.5%. DBR cap is strictly 45%.",
                "compliance": "✅ **Compliance:** Bangladesh Bank requires NID verification and CIB clearance for all loans above 50,000 BDT."
            }
            
            # Search for keyword in prompt
            keyword = "sme" if "sme" in prompt.lower() else ("retail" if "retail" in prompt.lower() else "compliance")
            
            # --- NEW: Historical & Multi-Product Logic ---
            live_keywords = ["rate", "bb", "bank", "circular", "latest", "new", "update", "download"]
            
            if "circular" in prompt.lower() or "list" in prompt.lower():
                response_text = "📚 **Search Results: Found 3 matching Circulars on BB Website:**"
                st.session_state.messages.append({"role": "assistant", "content": response_text})
                st.table({
                    "Date": ["08-Apr-2024", "12-Jan-2023", "05-Nov-2022"],
                    "Subject": ["SME Refinance Scheme Update", "Home Loan Interest Cap", "Auto Loan LTV Ratio"],
                    "Status": ["Active", "Superseded", "Archived"]
                })
                st.info("💡 Tip: Click the links in the sidebar to open the full versions.")
                st.stop()
            
            elif "2022" in prompt:
                response_text = "📜 **Historical Data (2022):** In 2022, Bangladesh Bank maintained a strict 9% cap on lending. The SME manual from that period shows much lower eligibility requirements for cottage industries."
            elif "2024" in prompt:
                response_text = "📜 **Past Policy (2024):** This was the year of the SMART rate introduction. The margin for SME loans was fixed at 3% above the SMART average."
            elif active_search and any(word in prompt.lower() for word in live_keywords):
                response_text = "🌐 **Live Search Result (Bangladesh Bank Website):**\n\nThe latest Bangladesh Bank circular (issued 2026) suggests a dynamic interest rate cap based on the SMART rate + 3.5%. \n\n📄 **[Download Official Circular (PDF)](https://www.bb.org.bd/en/index.php)**\n\n**Recommendation:** Use this live rate instead of the manual version."
            else:
                response_text = mock_answers.get(keyword, "I have analyzed the current IPDC manual. I cannot find a specific clause for this query. Please consult the Department Head.")

            # Simulate typing effect
            for chunk in response_text.split():
                full_response += chunk + " "
                time.sleep(0.05)
                message_placeholder.markdown(full_response + "▌")
            message_placeholder.markdown(full_response)
            
        st.session_state.messages.append({"role": "assistant", "content": full_response})

with tab2:
    st.subheader("Client Eligibility & DBR Calculator")
    st.write("Calculate maximum loan amount based on income and obligations.")
    
    col1, col2 = st.columns(2)
    with col1:
        income = st.number_input("Monthly Gross Income (BDT)", min_value=10000, value=100000, step=5000)
        obligations = st.number_input("Current Monthly EMIs (BDT)", min_value=0, value=20000, step=1000)
        dbr_limit = st.slider("DBR Limit (%)", 20, 60, 45)
    
    with col2:
        tenure = st.slider("Loan Tenure (Years)", 1, 25, 15)
        rate = st.slider("Interest Rate (%)", 5.0, 18.0, 11.5, 0.5)

    # --- Calculation Logic ---
    max_dbr_emi = income * (dbr_limit / 100)
    available_emi = max_dbr_emi - obligations
    
    # Financial Formula: PV = PMT * [(1 - (1+r)^-n) / r]
    monthly_rate = (rate / 100) / 12
    num_months = tenure * 12
    
    if available_emi > 0 and monthly_rate > 0:
        max_loan = available_emi * ((1 - (1 + monthly_rate)**-num_months) / monthly_rate)
    else:
        max_loan = 0

    st.divider()
    m1, m2, m3 = st.columns(3)
    m1.metric("Max Allowed EMI", f"{max_dbr_emi:,.0f} BDT")
    m2.metric("Available EMI", f"{available_emi:,.0f} BDT", delta=None if available_emi > 0 else "High Debt!")
    m3.metric("Max Loan Eligibility", f"{max_loan:,.0f} BDT")

    if available_emi <= 0:
        st.error("🚨 Client is over-leveraged. Their current obligations exceed the allowed DBR limit.")
    else:
        st.success(f"✅ Client is eligible for a loan of approximately **{max_loan/100000:,.1f} Lac BDT**.")
    
    # --- Comparison Table ---
    with st.expander("📊 Sensitivity Analysis (Rate vs. Principal)"):
        st.write("Loan eligibility at different interest rates:")
        rates_to_test = [9.0, 10.0, 11.0, 12.0, 13.0]
        comp_data = []
        for r in rates_to_test:
            mr = (r/100)/12
            loan = available_emi * ((1 - (1 + mr)**-num_months) / mr) if mr > 0 else 0
            comp_data.append({"Rate": f"{r}%", "Max Loan Amount (BDT)": f"{loan:,.0f}"})
        st.table(comp_data)

# --- DOCUMENT ANALYSIS TOOL (Bonus for the Thesis) ---
if uploaded_files:
    with st.expander("🔍 Policy Cross-Reference Analysis"):
        st.write(f"Analyzing {len(uploaded_files)} manuals for policy alignment...")
        st.progress(100)
        selected_manual = st.selectbox("Select Manual to Analyze", [f.name for f in uploaded_files])
        if st.button(f"Extract {selected_manual} Key Rules"):
            st.info(f"Summarizing key rules for {selected_manual}...")
