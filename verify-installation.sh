#!/bin/bash

################################################################################
# HoloVitals Installation Verification Script
# Verifies all components are installed and configured correctly
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/holovitals"
APP_PORT="3000"
CUSTOM_PORT="8443"

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        return 0
    else
        echo -e "${RED}✗ $2${NC}"
        return 1
    fi
}

TOTAL_CHECKS=0
PASSED_CHECKS=0

run_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if $1; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        return 1
    fi
}

################################################################################
# System Checks
################################################################################

print_header "System Checks"

check_os() {
    if [ -f /etc/lsb-release ]; then
        source /etc/lsb-release
        print_check 0 "Operating System: Ubuntu $DISTRIB_RELEASE"
        return 0
    else
        print_check 1 "Operating System: Not Ubuntu"
        return 1
    fi
}

check_disk_space() {
    available=$(df / | tail -1 | awk '{print $4}')
    if [ "$available" -gt 5242880 ]; then
        print_check 0 "Disk Space: $(df -h / | tail -1 | awk '{print $4}') available"
        return 0
    else
        print_check 1 "Disk Space: Less than 5GB available"
        return 1
    fi
}

check_memory() {
    total_mem=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$total_mem" -gt 2048 ]; then
        print_check 0 "Memory: ${total_mem}MB total"
        return 0
    else
        print_check 1 "Memory: ${total_mem}MB (recommended: 2GB+)"
        return 1
    fi
}

run_check check_os
run_check check_disk_space
run_check check_memory

################################################################################
# Software Checks
################################################################################

print_header "Software Installation Checks"

check_nodejs() {
    if command -v node &> /dev/null; then
        version=$(node --version)
        print_check 0 "Node.js: $version"
        return 0
    else
        print_check 1 "Node.js: Not installed"
        return 1
    fi
}

check_npm() {
    if command -v npm &> /dev/null; then
        version=$(npm --version)
        print_check 0 "npm: $version"
        return 0
    else
        print_check 1 "npm: Not installed"
        return 1
    fi
}

check_postgresql() {
    if command -v psql &> /dev/null; then
        version=$(psql --version | awk '{print $3}')
        print_check 0 "PostgreSQL: $version"
        return 0
    else
        print_check 1 "PostgreSQL: Not installed"
        return 1
    fi
}

check_redis() {
    if command -v redis-server &> /dev/null; then
        version=$(redis-server --version | awk '{print $3}')
        print_check 0 "Redis: $version"
        return 0
    else
        print_check 1 "Redis: Not installed"
        return 1
    fi
}

check_nginx() {
    if command -v nginx &> /dev/null; then
        version=$(nginx -v 2>&1 | awk '{print $3}')
        print_check 0 "Nginx: $version"
        return 0
    else
        print_check 1 "Nginx: Not installed"
        return 1
    fi
}

run_check check_nodejs
run_check check_npm
run_check check_postgresql
run_check check_redis
run_check check_nginx

################################################################################
# Service Checks
################################################################################

print_header "Service Status Checks"

check_postgresql_service() {
    if systemctl is-active --quiet postgresql; then
        print_check 0 "PostgreSQL Service: Running"
        return 0
    else
        print_check 1 "PostgreSQL Service: Not running"
        return 1
    fi
}

check_redis_service() {
    if systemctl is-active --quiet redis-server; then
        print_check 0 "Redis Service: Running"
        return 0
    else
        print_check 1 "Redis Service: Not running"
        return 1
    fi
}

check_nginx_service() {
    if systemctl is-active --quiet nginx; then
        print_check 0 "Nginx Service: Running"
        return 0
    else
        print_check 1 "Nginx Service: Not running"
        return 1
    fi
}

check_holovitals_service() {
    if systemctl is-active --quiet holovitals; then
        print_check 0 "HoloVitals Service: Running"
        return 0
    else
        print_check 1 "HoloVitals Service: Not running"
        return 1
    fi
}

run_check check_postgresql_service
run_check check_redis_service
run_check check_nginx_service
run_check check_holovitals_service

################################################################################
# Database Checks
################################################################################

print_header "Database Checks"

check_database_exists() {
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "holovitals"; then
        print_check 0 "Database: holovitals exists"
        return 0
    else
        print_check 1 "Database: holovitals not found"
        return 1
    fi
}

check_database_user() {
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='holovitals'" | grep -q 1; then
        print_check 0 "Database User: holovitals exists"
        return 0
    else
        print_check 1 "Database User: holovitals not found"
        return 1
    fi
}

check_database_tables() {
    table_count=$(sudo -u postgres psql -d holovitals -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
    if [ "$table_count" -gt 50 ]; then
        print_check 0 "Database Tables: $table_count tables found"
        return 0
    else
        print_check 1 "Database Tables: Only $table_count tables (expected 90+)"
        return 1
    fi
}

run_check check_database_exists
run_check check_database_user
run_check check_database_tables

################################################################################
# Application Checks
################################################################################

print_header "Application Checks"

check_install_directory() {
    if [ -d "$INSTALL_DIR/medical-analysis-platform" ]; then
        print_check 0 "Install Directory: $INSTALL_DIR exists"
        return 0
    else
        print_check 1 "Install Directory: $INSTALL_DIR not found"
        return 1
    fi
}

check_node_modules() {
    if [ -d "$INSTALL_DIR/medical-analysis-platform/node_modules" ]; then
        module_count=$(find "$INSTALL_DIR/medical-analysis-platform/node_modules" -maxdepth 1 -type d | wc -l)
        print_check 0 "Node Modules: $module_count packages installed"
        return 0
    else
        print_check 1 "Node Modules: Not installed"
        return 1
    fi
}

check_build() {
    if [ -d "$INSTALL_DIR/medical-analysis-platform/.next" ]; then
        build_size=$(du -sh "$INSTALL_DIR/medical-analysis-platform/.next" | cut -f1)
        print_check 0 "Application Build: $build_size"
        return 0
    else
        print_check 1 "Application Build: Not found"
        return 1
    fi
}

check_env_file() {
    if [ -f "$INSTALL_DIR/medical-analysis-platform/.env.production" ]; then
        print_check 0 "Environment File: .env.production exists"
        return 0
    else
        print_check 1 "Environment File: .env.production not found"
        return 1
    fi
}

run_check check_install_directory
run_check check_node_modules
run_check check_build
run_check check_env_file

################################################################################
# Network Checks
################################################################################

print_header "Network Checks"

check_app_port() {
    if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT" || ss -tlnp 2>/dev/null | grep -q ":$APP_PORT"; then
        print_check 0 "Application Port: $APP_PORT is listening"
        return 0
    else
        print_check 1 "Application Port: $APP_PORT not listening"
        return 1
    fi
}

check_nginx_port() {
    if netstat -tlnp 2>/dev/null | grep -q ":$CUSTOM_PORT" || ss -tlnp 2>/dev/null | grep -q ":$CUSTOM_PORT"; then
        print_check 0 "Nginx Port: $CUSTOM_PORT is listening"
        return 0
    else
        print_check 1 "Nginx Port: $CUSTOM_PORT not listening"
        return 1
    fi
}

check_firewall() {
    if ufw status | grep -q "Status: active"; then
        print_check 0 "Firewall: Active"
        return 0
    else
        print_check 1 "Firewall: Not active"
        return 1
    fi
}

run_check check_app_port
run_check check_nginx_port
run_check check_firewall

################################################################################
# Health Checks
################################################################################

print_header "Application Health Checks"

check_health_endpoint() {
    if curl -k -s https://localhost:$CUSTOM_PORT/health 2>/dev/null | grep -q "healthy"; then
        print_check 0 "Health Endpoint: Responding"
        return 0
    else
        print_check 1 "Health Endpoint: Not responding"
        return 1
    fi
}

check_app_response() {
    response_code=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:$CUSTOM_PORT/ 2>/dev/null)
    if [ "$response_code" == "200" ] || [ "$response_code" == "302" ]; then
        print_check 0 "Application Response: HTTP $response_code"
        return 0
    else
        print_check 1 "Application Response: HTTP $response_code (expected 200 or 302)"
        return 1
    fi
}

run_check check_health_endpoint
run_check check_app_response

################################################################################
# File Integrity Checks
################################################################################

print_header "File Integrity Checks"

check_credentials_file() {
    if [ -f "$INSTALL_DIR/CREDENTIALS.txt" ]; then
        print_check 0 "Credentials File: Exists"
        return 0
    else
        print_check 1 "Credentials File: Not found"
        return 1
    fi
}

check_backup_directory() {
    if [ -d "/var/backups/holovitals" ]; then
        print_check 0 "Backup Directory: Exists"
        return 0
    else
        print_check 1 "Backup Directory: Not found"
        return 1
    fi
}

check_management_scripts() {
    scripts=("holovitals-start" "holovitals-stop" "holovitals-restart" "holovitals-status" "holovitals-logs" "holovitals-update")
    missing=0
    for script in "${scripts[@]}"; do
        if [ ! -f "/usr/local/bin/$script" ]; then
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        print_check 0 "Management Scripts: All ${#scripts[@]} scripts present"
        return 0
    else
        print_check 1 "Management Scripts: $missing scripts missing"
        return 1
    fi
}

run_check check_credentials_file
run_check check_backup_directory
run_check check_management_scripts

################################################################################
# Security Checks
################################################################################

print_header "Security Checks"

check_ssl_certificate() {
    if [ -f "/etc/nginx/ssl/holovitals.crt" ] && [ -f "/etc/nginx/ssl/holovitals.key" ]; then
        print_check 0 "SSL Certificate: Present (self-signed)"
        return 0
    else
        print_check 1 "SSL Certificate: Not found"
        return 1
    fi
}

check_file_permissions() {
    if [ "$(stat -c %a "$INSTALL_DIR/medical-analysis-platform/.env.production" 2>/dev/null)" == "600" ]; then
        print_check 0 "File Permissions: .env.production is secure (600)"
        return 0
    else
        print_check 1 "File Permissions: .env.production not secure"
        return 1
    fi
}

check_fail2ban() {
    if systemctl is-active --quiet fail2ban; then
        print_check 0 "Fail2ban: Active"
        return 0
    else
        print_check 1 "Fail2ban: Not active"
        return 1
    fi
}

run_check check_ssl_certificate
run_check check_file_permissions
run_check check_fail2ban

################################################################################
# Summary
################################################################################

print_header "Verification Summary"

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo -e "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$((TOTAL_CHECKS - PASSED_CHECKS))${NC}"
echo -e "Success Rate: ${BLUE}${PERCENTAGE}%${NC}\n"

if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}✓ Installation verification PASSED${NC}"
    echo -e "${GREEN}HoloVitals is properly installed and configured!${NC}\n"
    exit 0
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠ Installation verification PARTIAL${NC}"
    echo -e "${YELLOW}Some components need attention. Review failed checks above.${NC}\n"
    exit 1
else
    echo -e "${RED}✗ Installation verification FAILED${NC}"
    echo -e "${RED}Multiple components are not properly configured. Review all failed checks.${NC}\n"
    exit 2
fi