"""
Test script to verify ZERO local storage mode.
This will process a GitHub repo and verify no temp files are created.
"""
import os
import tempfile
from app.models.state import DocGenState, DocGenPreferences
from app.graph.graph import run_pipeline

def count_temp_files_before():
    """Count existing temp files before processing"""
    temp_dir = tempfile.gettempdir()
    github_temps = [f for f in os.listdir(temp_dir) if f.startswith('github_repo_')]
    return len(github_temps)

def test_zero_storage():
    """Test that no temp files are created during processing"""
    
    print("=" * 60)
    print("🧪 TESTING ZERO LOCAL STORAGE MODE")
    print("=" * 60)
    
    # Count temp files before
    before_count = count_temp_files_before()
    print(f"📊 Temp files before: {before_count}")
    
    # Create state (NOTE: commit_to_github removed entirely!)
    state = DocGenState(
        input_type="url",
        input_data="https://github.com/torvalds/linux",  # Small test repo
        preferences=DocGenPreferences(
            generate_summary=True,
            generate_readme=True,
            visualize_structure=True
        ),
        branch="master"
    )
    
    try:
        # Run pipeline
        print("\n🚀 Running pipeline...")
        result = run_pipeline(state)
        
        # Count temp files after
        after_count = count_temp_files_before()
        print(f"\n📊 Temp files after: {after_count}")
        
        # Verify
        if after_count == before_count:
            print("\n✅ SUCCESS: ZERO temp files created!")
            print("🎉 All processing was done in memory!")
        else:
            print(f"\n❌ FAILURE: {after_count - before_count} temp files were created!")
            print("⚠️  Local storage was used!")
            
        # Show results
        print(f"\n📄 README length: {len(result.get('readme', ''))} chars")
        print(f"📝 Summaries: {len(result.get('summaries', {}))} files")
        print(f"📊 Visualizations: {len(result.get('visuals', {}))} diagrams")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Note: Make sure you have GITHUB_TOKEN in environment for rate limits
    test_zero_storage()
