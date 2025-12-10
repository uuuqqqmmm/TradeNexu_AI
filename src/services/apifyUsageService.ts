// Apify 账户使用情况服务
// 获取 API 调用次数、费用等信息

const APIFY_BASE_URL = 'https://api.apify.com/v2';

// 获取 Apify Token
const getApifyToken = (): string | null => {
    const token = import.meta.env.VITE_APIFY_TOKEN;
    return token && token !== 'your_apify_token_here' ? token : null;
};

// Apify 账户信息接口
export interface ApifyAccountInfo {
    userId: string;
    username: string;
    email: string;
    plan: {
        id: string;
        name: string;
        monthlyBasePriceUsd: number;
    };
}

// Apify 使用情况接口
export interface ApifyUsageInfo {
    // 当月使用情况
    currentPeriod: {
        startAt: string;
        endAt: string;
    };
    // 使用量统计
    usage: {
        actorComputeUnits: number;       // Actor 计算单元
        dataTransferGb: number;          // 数据传输 GB
        proxySerps: number;              // 代理 SERP 请求
        residentialProxyGb: number;      // 住宅代理 GB
    };
    // 费用统计 (USD)
    costs: {
        actorComputeUnits: number;
        dataTransfer: number;
        proxySerps: number;
        residentialProxy: number;
        total: number;
    };
    // 限额
    limits: {
        monthlyUsageUsd: number;         // 月度限额
        remainingUsd: number;            // 剩余额度
        usedPercentage: number;          // 已用百分比
    };
}

// 完整的资费信息
export interface ApifyBillingInfo {
    account: ApifyAccountInfo | null;
    usage: ApifyUsageInfo | null;
    lastUpdated: number;
    error: string | null;
}

/**
 * 获取 Apify 账户信息
 */
export const getApifyAccountInfo = async (): Promise<ApifyAccountInfo | null> => {
    const token = getApifyToken();
    if (!token) {
        console.log('[Apify] Token 未配置');
        return null;
    }

    try {
        const response = await fetch(`${APIFY_BASE_URL}/users/me?token=${token}`);
        
        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            userId: data.data.id,
            username: data.data.username,
            email: data.data.email,
            plan: {
                id: data.data.plan?.id || 'FREE',
                name: data.data.plan?.name || 'Free',
                monthlyBasePriceUsd: data.data.plan?.monthlyBasePriceUsd || 0
            }
        };
    } catch (error) {
        console.error('[Apify] 获取账户信息失败:', error);
        return null;
    }
};

/**
 * 获取 Apify 使用情况
 */
export const getApifyUsageInfo = async (): Promise<ApifyUsageInfo | null> => {
    const token = getApifyToken();
    if (!token) {
        console.log('[Apify] Token 未配置');
        return null;
    }

    try {
        // 获取账户使用统计
        const response = await fetch(`${APIFY_BASE_URL}/users/me/usage/monthly?token=${token}`);
        
        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        const usageData = data.data;

        // 计算费用 (基于 Apify 定价)
        const actorCost = (usageData.actorComputeUnits || 0) * 0.30; // $0.30 per CU
        const transferCost = (usageData.dataTransferInternalGb || 0) * 0.05; // $0.05 per GB
        const serpsCost = (usageData.proxySerps || 0) * 0.004; // $0.004 per SERP
        const residentialCost = (usageData.residentialProxyGb || 0) * 12; // $12 per GB
        const totalCost = actorCost + transferCost + serpsCost + residentialCost;

        // 免费额度 $5/月
        const monthlyLimit = 5.0;
        const remaining = Math.max(0, monthlyLimit - totalCost);
        const usedPercentage = Math.min(100, (totalCost / monthlyLimit) * 100);

        return {
            currentPeriod: {
                startAt: usageData.startAt || new Date().toISOString(),
                endAt: usageData.endAt || new Date().toISOString()
            },
            usage: {
                actorComputeUnits: usageData.actorComputeUnits || 0,
                dataTransferGb: usageData.dataTransferInternalGb || 0,
                proxySerps: usageData.proxySerps || 0,
                residentialProxyGb: usageData.residentialProxyGb || 0
            },
            costs: {
                actorComputeUnits: actorCost,
                dataTransfer: transferCost,
                proxySerps: serpsCost,
                residentialProxy: residentialCost,
                total: totalCost
            },
            limits: {
                monthlyUsageUsd: monthlyLimit,
                remainingUsd: remaining,
                usedPercentage: usedPercentage
            }
        };
    } catch (error) {
        console.error('[Apify] 获取使用情况失败:', error);
        return null;
    }
};

/**
 * 获取完整的 Apify 资费信息
 */
export const getApifyBillingInfo = async (): Promise<ApifyBillingInfo> => {
    try {
        const [account, usage] = await Promise.all([
            getApifyAccountInfo(),
            getApifyUsageInfo()
        ]);

        return {
            account,
            usage,
            lastUpdated: Date.now(),
            error: null
        };
    } catch (error) {
        return {
            account: null,
            usage: null,
            lastUpdated: Date.now(),
            error: error instanceof Error ? error.message : '获取资费信息失败'
        };
    }
};

/**
 * 检查是否配置了 Apify
 */
export const isApifyConfigured = (): boolean => {
    return getApifyToken() !== null;
};
