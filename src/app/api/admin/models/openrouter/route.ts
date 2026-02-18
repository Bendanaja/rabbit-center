import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

// Map OpenRouter provider slugs to our local icon files
const PROVIDER_ICONS: Record<string, string> = {
  'openai': '/images/models/openai.svg',
  'anthropic': '/images/models/anthropic.svg',
  'google': '/images/models/google.svg',
  'deepseek': '/images/models/deepseek.svg',
  'meta-llama': '/images/models/meta.svg',
  'meta': '/images/models/meta.svg',
  'mistralai': '/images/models/mistral.svg',
  'mistral': '/images/models/mistral.svg',
  'x-ai': '/images/models/xai.svg',
  'nvidia': '/images/models/nvidia.svg',
  'qwen': '/images/models/byteplus.svg',
  'stepfun': '/images/models/stepfun.svg',
  'moonshotai': '/images/models/kimi.svg',
  'moonshot': '/images/models/kimi.svg',
  'zhipu': '/images/models/zhipu.svg',
  'thudm': '/images/models/zhipu.svg',
};

function getProviderIcon(modelId: string): string {
  const slug = modelId.split('/')[0]?.toLowerCase() || '';
  return PROVIDER_ICONS[slug] || '';
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  top_provider?: {
    is_moderated?: boolean;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

// GET /api/admin/models/openrouter?q=search_term
// Fetch and search OpenRouter's available models
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check admin access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const searchQuery = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  try {
    // Fetch models from OpenRouter API (public endpoint, no API key needed)
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const allModels: OpenRouterModel[] = data.data || [];

    // Filter by search query (name and ID only — not description)
    let filtered = allModels;
    if (searchQuery) {
      filtered = allModels.filter(m =>
        m.id.toLowerCase().includes(searchQuery) ||
        m.name?.toLowerCase().includes(searchQuery)
      );

      // Sort: exact name match first, then name starts-with, then rest
      filtered.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aId = a.id.toLowerCase();
        const bId = b.id.toLowerCase();

        const aExact = aName === searchQuery || aId === searchQuery;
        const bExact = bName === searchQuery || bId === searchQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = aName.startsWith(searchQuery) || aId.includes('/' + searchQuery);
        const bStarts = bName.startsWith(searchQuery) || bId.includes('/' + searchQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aName.localeCompare(bName);
      });
    }

    // Get existing model IDs in our DB to mark duplicates
    const { data: existing } = await supabase
      .from('ai_models')
      .select('id');
    const existingIds = new Set((existing || []).map(m => m.id));

    const results = filtered
      .slice(0, 100)
      .map(m => {
        const promptCost = parseFloat(m.pricing?.prompt || '0');
        const completionCost = parseFloat(m.pricing?.completion || '0');
        const provider = m.id.split('/')[0] || 'unknown';

        // Auto-detect capabilities from output modalities
        const outputModalities = m.architecture?.output_modalities || [];
        const suggestedCapabilities: string[] = [];
        if (outputModalities.includes('image')) {
          suggestedCapabilities.push('chat-image-gen');
        }

        return {
          id: m.id,
          name: m.name || m.id,
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          description: m.description || '',
          context_length: m.context_length || 0,
          prompt_cost: promptCost,
          completion_cost: completionCost,
          is_free: promptCost === 0 && completionCost === 0,
          modality: m.architecture?.modality || 'text->text',
          already_added: existingIds.has(m.id),
          icon_url: getProviderIcon(m.id),
          suggested_capabilities: suggestedCapabilities,
        };
      });

    return NextResponse.json({
      models: results,
      total: filtered.length,
    });
  } catch (error) {
    console.error('OpenRouter fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OpenRouter models' },
      { status: 500 }
    );
  }
}
