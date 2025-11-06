import { InferenceClient} from '@huggingface/inference';

const EmbeddingModal = process.env.HF_MODAL;
class HuggingFaceEmbeddings {
  constructor() {
    this.hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
    this.model = EmbeddingModal;
    this.dimension = 384; // This model outputs 384-dimensional embeddings
  }

  async generateEmbeddings(texts) {
    try {
      console.log(`🤗 Generating embeddings for ${texts.length} texts using ${this.model}...`);
      
      const embeddings = [];
      
      for (const text of texts) {
        try {
          const result = await this.hf.featureExtraction({
            model: this.model,
            inputs: text,
          });
          
          if (result && Array.isArray(result)) {
            embeddings.push(result);
          } else {
            throw new Error('Invalid embedding response format');
          }
          
          // Add small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('Error generating embedding for text:', error);
          throw new Error(`Failed to generate embedding: ${error.message}`);
        }
      }
      
      console.log(`✅ Successfully generated ${embeddings.length} embeddings`);
      return embeddings;
      
    } catch (error) {
      console.error('❌ Error in generateEmbeddings:', error);
      throw error;
    }
  }

  // Generate single embedding
  async generateEmbedding(text) {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }
}

// Create singleton instance
const hfEmbeddings = new HuggingFaceEmbeddings();
export default hfEmbeddings;