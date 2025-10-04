# HoloVitals AI Architecture

## Dual AI System Design

### Overview

HoloVitals uses a **two-tier AI architecture** to balance cost, performance, and HIPAA compliance:

1. **Lightweight Chatbot** - Always available, fast responses, general queries
2. **Heavy-Duty Analysis Engine** - HIPAA-compliant, ephemeral instances, deep analysis

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                      (Next.js Frontend)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│   Lightweight Chatbot     │  │  Document Upload Handler     │
│   (Always Running)        │  │  (API Route)                 │
│                           │  │                              │
│   • GPT-3.5 Turbo        │  │  • File validation           │
│   • <2 second response   │  │  • PHI sanitization          │
│   • General queries      │  │  • Queue for analysis        │
│   • Navigation help      │  └──────────────┬───────────────┘
│   • Quick answers        │                 │
└───────────┬───────────────┘                 │
            │                                 │
            │ Escalates complex queries       │
            │                                 │
            └────────────┬────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Analysis Queue System                         │
│                   (Redis/PostgreSQL)                             │
│                                                                   │
│  • Priority queue (URGENT, HIGH, NORMAL, LOW)                   │
│  • Task distribution                                             │
│  • Status tracking                                               │
│  • Result caching                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│  Context Optimizer        │  │  Instance Provisioner        │
│  (Pre-processing)         │  │  (Azure/AWS)                 │
│                           │  │                              │
│  • Analyze context size   │  │  • Spin up HIPAA instance   │
│  • Split if needed        │  │  • Load LLM model           │
│  • Optimize prompts       │  │  • Execute analysis         │
│  • Select best LLM        │  │  • Return results           │
│                           │  │  • De-provision instance    │
└───────────┬───────────────┘  └──────────────┬───────────────┘
            │                                 │
            └────────────┬────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              HIPAA-Compliant Analysis Engine                     │
│              (Ephemeral Cloud Instances)                         │
│                                                                   │
│  Available Models (Auto-Selected):                               │
│  • GPT-4 Turbo (128k context) - Complex analysis                │
│  • GPT-4 (8k context) - Standard analysis                       │
│  • Claude 3 Opus (200k context) - Large documents               │
│  • Claude 3 Sonnet (200k context) - Cost-efficient              │
│  • Llama 3 70B (8k context) - Open source option                │
│                                                                   │
│  Instance Lifecycle: 5-30 minutes                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results Processing                            │
│                                                                   │
│  • PHI sanitization                                              │
│  • Result validation                                             │
│  • Cache storage                                                 │
│  • User notification                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Lightweight Chatbot (Tier 1)

**Purpose:** Handle 80% of user interactions with fast, cost-effective responses

**Technology Stack:**
- **Model:** OpenAI GPT-3.5 Turbo (4k context)
- **Hosting:** Always-on API endpoint (Next.js API route)
- **Response Time:** <2 seconds
- **Cost:** ~$0.002 per interaction

**Capabilities:**
- General health questions
- Medication reminders
- Appointment scheduling
- Navigation assistance
- Document upload guidance
- Quick lookups (symptoms, medications)
- Conversational interface

**Limitations:**
- No PHI processing
- No deep medical analysis
- No document analysis
- Limited context window

**Implementation:**

```typescript
// services/LightweightChatbotService.ts

interface ChatbotConfig {
  model: 'gpt-3.5-turbo';
  maxTokens: 500;
  temperature: 0.7;
  systemPrompt: string;
}

interface ChatbotResponse {
  message: string;
  needsEscalation: boolean;
  escalationReason?: string;
  confidence: number;
}

class LightweightChatbotService {
  private config: ChatbotConfig = {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.7,
    systemPrompt: `You are a helpful health assistant for HoloVitals. 
    You provide general health information, help with navigation, and answer 
    basic questions. For complex medical analysis or document review, 
    escalate to the deep analysis system. Never provide medical diagnoses 
    or treatment recommendations - always recommend consulting healthcare 
    providers for medical advice.`
  };

  async chat(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<ChatbotResponse> {
    // Check if escalation is needed
    const escalationCheck = this.shouldEscalate(message);
    
    if (escalationCheck.shouldEscalate) {
      return {
        message: "I'll connect you with our deep analysis system for a comprehensive review.",
        needsEscalation: true,
        escalationReason: escalationCheck.reason,
        confidence: 1.0
      };
    }

    // Generate response using GPT-3.5
    const response = await this.generateResponse(message, conversationHistory);
    
    return {
      message: response.content,
      needsEscalation: false,
      confidence: response.confidence
    };
  }

  private shouldEscalate(message: string): {
    shouldEscalate: boolean;
    reason?: string;
  } {
    const escalationKeywords = [
      'analyze document',
      'review my labs',
      'interpret results',
      'diagnosis',
      'treatment plan',
      'medical opinion',
      'compare my results'
    ];

    const lowerMessage = message.toLowerCase();
    
    for (const keyword of escalationKeywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          shouldEscalate: true,
          reason: `Complex query requiring deep analysis: ${keyword}`
        };
      }
    }

    return { shouldEscalate: false };
  }

  private async generateResponse(
    message: string,
    history: ChatMessage[]
  ): Promise<{ content: string; confidence: number }> {
    // Implementation using OpenAI API
    // Returns quick, general responses
    return {
      content: "Generated response",
      confidence: 0.85
    };
  }
}
```

### 2. Heavy-Duty Analysis Engine (Tier 2)

**Purpose:** Deep medical document analysis, complex queries, comprehensive insights

**Technology Stack:**
- **Models:** GPT-4 Turbo, Claude 3 Opus/Sonnet, Llama 3 70B
- **Hosting:** Ephemeral cloud instances (Azure/AWS)
- **Response Time:** 5-30 minutes
- **Cost:** $0.50-$5.00 per analysis (depending on complexity)

**Capabilities:**
- Full medical document analysis
- Multi-document comparison
- Trend analysis over time
- Complex medical reasoning
- Detailed recommendations
- Risk assessment
- Drug interaction analysis

**HIPAA Compliance:**
- Azure Health Data Services
- AWS HealthLake
- Encrypted data in transit and at rest
- Audit logging
- Access controls
- PHI sanitization before caching

### 3. Context Window Optimization

**Problem:** Large documents may exceed LLM context windows

**Solution:** Intelligent prompt splitting and parallel processing

```typescript
// services/ContextOptimizerService.ts

interface ContextAnalysis {
  totalTokens: number;
  contextWindow: number;
  needsSplitting: boolean;
  splitStrategy?: 'sequential' | 'parallel' | 'hierarchical';
  estimatedCost: number;
  recommendedModel: string;
}

interface PromptSplit {
  id: string;
  content: string;
  tokens: number;
  order: number;
  dependencies: string[];
}

class ContextOptimizerService {
  // Model context windows
  private modelContextWindows = {
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'llama-3-70b': 8192
  };

  // Model costs per 1M tokens (input/output)
  private modelCosts = {
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4': { input: 30, output: 60 },
    'claude-3-opus': { input: 15, output: 75 },
    'claude-3-sonnet': { input: 3, output: 15 },
    'llama-3-70b': { input: 0.9, output: 0.9 } // Self-hosted estimate
  };

  async analyzeContext(
    documents: string[],
    analysisType: string
  ): Promise<ContextAnalysis> {
    // Calculate total tokens
    const totalTokens = this.estimateTokens(documents.join('\n'));
    
    // Select optimal model
    const recommendedModel = this.selectOptimalModel(totalTokens, analysisType);
    const contextWindow = this.modelContextWindows[recommendedModel];
    
    // Determine if splitting is needed
    const needsSplitting = totalTokens > (contextWindow * 0.8); // 80% threshold
    
    // Calculate estimated cost
    const estimatedCost = this.calculateCost(
      totalTokens,
      recommendedModel,
      needsSplitting
    );

    return {
      totalTokens,
      contextWindow,
      needsSplitting,
      splitStrategy: needsSplitting ? this.determineSplitStrategy(analysisType) : undefined,
      estimatedCost,
      recommendedModel
    };
  }

  async splitPrompt(
    content: string,
    contextWindow: number,
    strategy: 'sequential' | 'parallel' | 'hierarchical'
  ): Promise<PromptSplit[]> {
    const tokens = this.estimateTokens(content);
    const maxTokensPerSplit = Math.floor(contextWindow * 0.7); // Leave room for system prompt

    if (strategy === 'sequential') {
      return this.splitSequentially(content, maxTokensPerSplit);
    } else if (strategy === 'parallel') {
      return this.splitInParallel(content, maxTokensPerSplit);
    } else {
      return this.splitHierarchically(content, maxTokensPerSplit);
    }
  }

  private selectOptimalModel(
    tokens: number,
    analysisType: string
  ): string {
    // Priority: Cost efficiency > Context window > Performance
    
    if (tokens < 7000) {
      // Small documents - use most cost-efficient
      return 'llama-3-70b'; // or 'claude-3-sonnet'
    } else if (tokens < 100000) {
      // Medium documents - balance cost and performance
      return 'gpt-4-turbo';
    } else {
      // Large documents - need large context window
      return 'claude-3-opus';
    }
  }

  private determineSplitStrategy(analysisType: string): 'sequential' | 'parallel' | 'hierarchical' {
    // Sequential: For time-series data, chronological analysis
    // Parallel: For independent sections (multiple lab reports)
    // Hierarchical: For complex documents with subsections

    if (analysisType.includes('timeline') || analysisType.includes('trend')) {
      return 'sequential';
    } else if (analysisType.includes('compare') || analysisType.includes('multiple')) {
      return 'parallel';
    } else {
      return 'hierarchical';
    }
  }

  private splitSequentially(content: string, maxTokens: number): PromptSplit[] {
    // Split content into sequential chunks
    const chunks: PromptSplit[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let order = 0;

    const paragraphs = content.split('\n\n');

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);

      if (currentTokens + paragraphTokens > maxTokens) {
        // Save current chunk
        chunks.push({
          id: `chunk-${order}`,
          content: currentChunk,
          tokens: currentTokens,
          order: order,
          dependencies: order > 0 ? [`chunk-${order - 1}`] : []
        });

        // Start new chunk
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
        order++;
      } else {
        currentChunk += '\n\n' + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    // Add final chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk-${order}`,
        content: currentChunk,
        tokens: currentTokens,
        order: order,
        dependencies: order > 0 ? [`chunk-${order - 1}`] : []
      });
    }

    return chunks;
  }

  private splitInParallel(content: string, maxTokens: number): PromptSplit[] {
    // Split content into independent parallel chunks
    // Each chunk can be processed simultaneously
    const chunks: PromptSplit[] = [];
    const sections = this.identifySections(content);

    let order = 0;
    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section);

      if (sectionTokens <= maxTokens) {
        chunks.push({
          id: `section-${order}`,
          content: section,
          tokens: sectionTokens,
          order: order,
          dependencies: [] // No dependencies - can run in parallel
        });
        order++;
      } else {
        // Section too large - split further
        const subChunks = this.splitSequentially(section, maxTokens);
        chunks.push(...subChunks.map(chunk => ({
          ...chunk,
          id: `section-${order}-${chunk.id}`,
          order: order
        })));
        order++;
      }
    }

    return chunks;
  }

  private splitHierarchically(content: string, maxTokens: number): PromptSplit[] {
    // Create hierarchical structure: summary → details
    const chunks: PromptSplit[] = [];

    // First pass: Create summary
    const summary = this.extractSummary(content);
    chunks.push({
      id: 'summary',
      content: summary,
      tokens: this.estimateTokens(summary),
      order: 0,
      dependencies: []
    });

    // Second pass: Split detailed sections
    const sections = this.identifySections(content);
    let order = 1;

    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section);

      if (sectionTokens <= maxTokens) {
        chunks.push({
          id: `detail-${order}`,
          content: section,
          tokens: sectionTokens,
          order: order,
          dependencies: ['summary'] // Depends on summary
        });
        order++;
      }
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private identifySections(content: string): string[] {
    // Identify logical sections in document
    // Look for headers, page breaks, etc.
    return content.split(/\n#{1,3}\s+/);
  }

  private extractSummary(content: string): string {
    // Extract or generate summary of content
    // Take first few paragraphs or key sections
    const paragraphs = content.split('\n\n');
    return paragraphs.slice(0, 3).join('\n\n');
  }

  private calculateCost(
    tokens: number,
    model: string,
    needsSplitting: boolean
  ): number {
    const costs = this.modelCosts[model];
    const inputCost = (tokens / 1000000) * costs.input;
    const outputCost = (tokens * 0.3 / 1000000) * costs.output; // Assume 30% output

    if (needsSplitting) {
      // Add overhead for splitting (multiple API calls)
      return (inputCost + outputCost) * 1.5;
    }

    return inputCost + outputCost;
  }
}
```

### 4. Queue System

**Purpose:** Manage analysis tasks efficiently with priority handling

```typescript
// services/AnalysisQueueService.ts

enum QueuePriority {
  URGENT = 1,    // <5 minutes
  HIGH = 2,      // <15 minutes
  NORMAL = 3,    // <30 minutes
  LOW = 4        // <60 minutes
}

interface QueueTask {
  id: string;
  userId: string;
  type: 'document_analysis' | 'complex_query' | 'comparison' | 'trend_analysis';
  priority: QueuePriority;
  documents: string[];
  prompt: string;
  contextAnalysis: ContextAnalysis;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

class AnalysisQueueService {
  async addToQueue(task: Omit<QueueTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const queueTask: QueueTask = {
      ...task,
      id: this.generateTaskId(),
      status: 'queued',
      createdAt: new Date()
    };

    // Add to database queue
    await prisma.analysisQueue.create({
      data: queueTask
    });

    // Notify user
    await this.notifyUser(task.userId, 'queued', queueTask.id);

    // Trigger processing
    await this.processQueue();

    return queueTask.id;
  }

  async processQueue(): Promise<void> {
    // Get next task by priority
    const task = await this.getNextTask();

    if (!task) return;

    try {
      // Update status
      await this.updateTaskStatus(task.id, 'processing');

      // Provision instance and execute
      const result = await this.executeAnalysis(task);

      // Update with result
      await this.updateTaskStatus(task.id, 'completed', result);

      // Notify user
      await this.notifyUser(task.userId, 'completed', task.id);

    } catch (error) {
      await this.updateTaskStatus(task.id, 'failed', null, error.message);
      await this.notifyUser(task.userId, 'failed', task.id);
    }

    // Process next task
    await this.processQueue();
  }

  private async getNextTask(): Promise<QueueTask | null> {
    return await prisma.analysisQueue.findFirst({
      where: { status: 'queued' },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  private async executeAnalysis(task: QueueTask): Promise<any> {
    // This will call the instance provisioner
    const provisioner = new InstanceProvisionerService();
    return await provisioner.executeAnalysis(task);
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateTaskStatus(
    taskId: string,
    status: QueueTask['status'],
    result?: any,
    error?: string
  ): Promise<void> {
    await prisma.analysisQueue.update({
      where: { id: taskId },
      data: {
        status,
        result,
        error,
        ...(status === 'processing' && { startedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(status === 'failed' && { completedAt: new Date() })
      }
    });
  }

  private async notifyUser(
    userId: string,
    status: string,
    taskId: string
  ): Promise<void> {
    // Send notification to user
    // Implementation depends on notification service
  }
}
```

### 5. Instance Provisioner (Cloud Infrastructure)

**Purpose:** Spin up ephemeral HIPAA-compliant instances for analysis

```typescript
// services/InstanceProvisionerService.ts

interface CloudInstance {
  id: string;
  provider: 'azure' | 'aws';
  region: string;
  instanceType: string;
  model: string;
  status: 'provisioning' | 'ready' | 'executing' | 'deprovisioning' | 'terminated';
  createdAt: Date;
  terminatedAt?: Date;
  cost: number;
}

class InstanceProvisionerService {
  private azureClient: any; // Azure SDK client
  private awsClient: any;   // AWS SDK client

  async executeAnalysis(task: QueueTask): Promise<any> {
    let instance: CloudInstance | null = null;

    try {
      // 1. Provision instance
      instance = await this.provisionInstance(
        task.contextAnalysis.recommendedModel
      );

      // 2. Load model
      await this.loadModel(instance, task.contextAnalysis.recommendedModel);

      // 3. Execute analysis
      const result = await this.runAnalysis(instance, task);

      // 4. Sanitize result (remove any PHI before caching)
      const sanitizedResult = await this.sanitizeResult(result);

      // 5. Return result
      return sanitizedResult;

    } finally {
      // 6. Always deprovision instance
      if (instance) {
        await this.deprovisionInstance(instance);
      }
    }
  }

  private async provisionInstance(model: string): Promise<CloudInstance> {
    // Determine provider based on model and availability
    const provider = this.selectProvider(model);

    if (provider === 'azure') {
      return await this.provisionAzureInstance(model);
    } else {
      return await this.provisionAWSInstance(model);
    }
  }

  private async provisionAzureInstance(model: string): Promise<CloudInstance> {
    // Use Azure Health Data Services
    // Provision GPU instance for model inference
    
    const instanceConfig = {
      resourceGroup: 'holovitals-hipaa',
      location: 'eastus',
      vmSize: this.getVMSize(model),
      image: 'hipaa-compliant-ml-image',
      tags: {
        purpose: 'medical-analysis',
        compliance: 'hipaa',
        model: model
      }
    };

    // Provision VM
    const vm = await this.azureClient.virtualMachines.createOrUpdate(
      instanceConfig.resourceGroup,
      `analysis-${Date.now()}`,
      instanceConfig
    );

    return {
      id: vm.id,
      provider: 'azure',
      region: instanceConfig.location,
      instanceType: instanceConfig.vmSize,
      model: model,
      status: 'provisioning',
      createdAt: new Date(),
      cost: 0
    };
  }

  private async provisionAWSInstance(model: string): Promise<CloudInstance> {
    // Use AWS HealthLake
    // Provision EC2 instance with GPU for model inference

    const instanceConfig = {
      ImageId: 'ami-hipaa-compliant-ml',
      InstanceType: this.getInstanceType(model),
      MinCount: 1,
      MaxCount: 1,
      SecurityGroupIds: ['sg-hipaa-compliant'],
      SubnetId: 'subnet-private-hipaa',
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [
          { Key: 'Purpose', Value: 'medical-analysis' },
          { Key: 'Compliance', Value: 'hipaa' },
          { Key: 'Model', Value: model }
        ]
      }]
    };

    // Launch instance
    const response = await this.awsClient.runInstances(instanceConfig);

    return {
      id: response.Instances[0].InstanceId,
      provider: 'aws',
      region: 'us-east-1',
      instanceType: instanceConfig.InstanceType,
      model: model,
      status: 'provisioning',
      createdAt: new Date(),
      cost: 0
    };
  }

  private async loadModel(instance: CloudInstance, model: string): Promise<void> {
    // Load model onto instance
    // This could involve:
    // 1. Downloading model weights from secure storage
    // 2. Loading into GPU memory
    // 3. Warming up model
    
    // Wait for model to be ready
    await this.waitForModelReady(instance);
  }

  private async runAnalysis(
    instance: CloudInstance,
    task: QueueTask
  ): Promise<any> {
    // Execute analysis on instance
    
    if (task.contextAnalysis.needsSplitting) {
      // Run split analysis
      return await this.runSplitAnalysis(instance, task);
    } else {
      // Run single analysis
      return await this.runSingleAnalysis(instance, task);
    }
  }

  private async runSplitAnalysis(
    instance: CloudInstance,
    task: QueueTask
  ): Promise<any> {
    const optimizer = new ContextOptimizerService();
    
    // Split prompt
    const splits = await optimizer.splitPrompt(
      task.prompt,
      task.contextAnalysis.contextWindow,
      task.contextAnalysis.splitStrategy!
    );

    // Process splits based on strategy
    if (task.contextAnalysis.splitStrategy === 'parallel') {
      // Process in parallel
      const results = await Promise.all(
        splits.map(split => this.executeSplit(instance, split, task))
      );
      return this.mergeResults(results);
    } else {
      // Process sequentially
      const results = [];
      for (const split of splits) {
        const result = await this.executeSplit(instance, split, task);
        results.push(result);
      }
      return this.mergeResults(results);
    }
  }

  private async runSingleAnalysis(
    instance: CloudInstance,
    task: QueueTask
  ): Promise<any> {
    // Make API call to model on instance
    const response = await this.callModel(instance, {
      prompt: task.prompt,
      documents: task.documents,
      model: instance.model
    });

    return response;
  }

  private async executeSplit(
    instance: CloudInstance,
    split: PromptSplit,
    task: QueueTask
  ): Promise<any> {
    // Execute single split
    return await this.callModel(instance, {
      prompt: split.content,
      documents: task.documents,
      model: instance.model
    });
  }

  private async callModel(
    instance: CloudInstance,
    params: any
  ): Promise<any> {
    // Make HTTP request to model API on instance
    // This is provider-specific
    
    if (instance.provider === 'azure') {
      return await this.callAzureModel(instance, params);
    } else {
      return await this.callAWSModel(instance, params);
    }
  }

  private async sanitizeResult(result: any): Promise<any> {
    // Remove any PHI before caching
    const sanitizer = new HIPAASanitizerService();
    return await sanitizer.sanitize(result);
  }

  private async deprovisionInstance(instance: CloudInstance): Promise<void> {
    // Terminate instance
    
    if (instance.provider === 'azure') {
      await this.azureClient.virtualMachines.delete(
        'holovitals-hipaa',
        instance.id
      );
    } else {
      await this.awsClient.terminateInstances({
        InstanceIds: [instance.id]
      });
    }

    // Log cost
    await this.logInstanceCost(instance);
  }

  private selectProvider(model: string): 'azure' | 'aws' {
    // Select provider based on model availability and cost
    // For now, default to Azure
    return 'azure';
  }

  private getVMSize(model: string): string {
    // Return appropriate Azure VM size for model
    const vmSizes = {
      'gpt-4-turbo': 'Standard_NC6s_v3',
      'gpt-4': 'Standard_NC6s_v3',
      'claude-3-opus': 'Standard_NC12s_v3',
      'claude-3-sonnet': 'Standard_NC6s_v3',
      'llama-3-70b': 'Standard_NC24s_v3'
    };

    return vmSizes[model] || 'Standard_NC6s_v3';
  }

  private getInstanceType(model: string): string {
    // Return appropriate AWS instance type for model
    const instanceTypes = {
      'gpt-4-turbo': 'p3.2xlarge',
      'gpt-4': 'p3.2xlarge',
      'claude-3-opus': 'p3.8xlarge',
      'claude-3-sonnet': 'p3.2xlarge',
      'llama-3-70b': 'p3.16xlarge'
    };

    return instanceTypes[model] || 'p3.2xlarge';
  }

  private async waitForModelReady(instance: CloudInstance): Promise<void> {
    // Poll instance until model is ready
    // Typically takes 2-5 minutes
  }

  private mergeResults(results: any[]): any {
    // Merge results from split analysis
    // This depends on the analysis type
    return {
      summary: this.generateSummary(results),
      details: results,
      merged: true
    };
  }

  private generateSummary(results: any[]): string {
    // Generate summary from multiple results
    return results.map(r => r.summary).join('\n\n');
  }

  private async logInstanceCost(instance: CloudInstance): Promise<void> {
    // Calculate and log instance cost
    const duration = instance.terminatedAt 
      ? (instance.terminatedAt.getTime() - instance.createdAt.getTime()) / 1000 / 60
      : 0;

    const costPerMinute = this.getCostPerMinute(instance.instanceType);
    const totalCost = duration * costPerMinute;

    await prisma.instanceCost.create({
      data: {
        instanceId: instance.id,
        provider: instance.provider,
        instanceType: instance.instanceType,
        model: instance.model,
        duration: duration,
        cost: totalCost,
        createdAt: instance.createdAt,
        terminatedAt: instance.terminatedAt
      }
    });
  }

  private getCostPerMinute(instanceType: string): number {
    // Return cost per minute for instance type
    const costs = {
      'Standard_NC6s_v3': 0.90 / 60,  // $0.90/hour
      'Standard_NC12s_v3': 1.80 / 60,
      'Standard_NC24s_v3': 3.60 / 60,
      'p3.2xlarge': 3.06 / 60,
      'p3.8xlarge': 12.24 / 60,
      'p3.16xlarge': 24.48 / 60
    };

    return costs[instanceType] || 1.00 / 60;
  }

  private async callAzureModel(instance: CloudInstance, params: any): Promise<any> {
    // Implementation for Azure
    return {};
  }

  private async callAWSModel(instance: CloudInstance, params: any): Promise<any> {
    // Implementation for AWS
    return {};
  }
}
```

## Cost Analysis

### Lightweight Chatbot
- **Cost per interaction:** ~$0.002
- **Expected volume:** 1,000 interactions/day
- **Monthly cost:** ~$60

### Heavy-Duty Analysis
- **Cost per analysis:** $0.50-$5.00
- **Expected volume:** 100 analyses/day
- **Monthly cost:** ~$5,000-$15,000

### Cloud Infrastructure
- **Instance cost:** $0.90-$3.06/hour
- **Average analysis time:** 15 minutes
- **Cost per analysis:** $0.23-$0.77
- **Monthly infrastructure cost:** ~$2,300-$7,700

### Total Estimated Monthly Cost
- **Chatbot:** $60
- **Analysis:** $5,000-$15,000
- **Infrastructure:** $2,300-$7,700
- **Total:** $7,360-$22,760

### Cost Optimization Strategies
1. Use smaller models when possible (Llama 3, Claude Sonnet)
2. Cache common analyses
3. Batch similar analyses
4. Use spot instances when available
5. Optimize context windows to reduce tokens
6. Implement smart escalation to avoid unnecessary deep analysis

## HIPAA Compliance Checklist

✅ **Encrypted Data in Transit** - TLS 1.3
✅ **Encrypted Data at Rest** - AES-256
✅ **Access Controls** - Role-based access
✅ **Audit Logging** - Complete audit trail
✅ **PHI Sanitization** - Before caching
✅ **Ephemeral Instances** - No persistent PHI storage
✅ **Business Associate Agreement** - With cloud providers
✅ **Breach Notification** - Automated detection
✅ **Minimum Necessary** - Context optimization
✅ **Patient Consent** - Required for analysis

## Implementation Timeline

**Week 1-2:** Lightweight chatbot
**Week 3-4:** Queue system and context optimizer
**Week 5-6:** Instance provisioner (Azure)
**Week 7-8:** Instance provisioner (AWS)
**Week 9-10:** Testing and optimization
**Week 11-12:** Production deployment

## Next Steps

1. Set up Azure Health Data Services account
2. Configure HIPAA-compliant infrastructure
3. Implement lightweight chatbot
4. Build queue system
5. Develop context optimizer
6. Create instance provisioner
7. Test end-to-end workflow
8. Deploy to production