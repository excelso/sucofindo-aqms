<div class="form-group-control bg-white">
    <select class="form-control select2-custom {{ $class }}" name="{{ $name }}" id="{{ $id }}" {{ $disabled }} data-selected="{{ $selected }}">
        <option value="">...</option>
        @foreach($options as $item)
            @php($select = $item->id == $selected ? 'selected' : '')
            <option value="{{ $item->id }}" {{ $select }}>{{ $item->bank_code }} - {{ $item->bank_name }}</option>
        @endforeach
    </select>
</div>
